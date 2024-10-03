package org.lowcoder.plugin.clickhouse;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.clickhouse.model.ClickHouseDatasourceConfig;
import org.lowcoder.plugin.clickhouse.model.ClickHouseQueryConfig;
import org.lowcoder.plugin.clickhouse.utils.ClickHouseStructureParser;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.exception.InvalidHikariDatasourceException;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.LocaleMessage;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.plugin.common.SqlQueryUtils;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.pf4j.Extension;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.sql.*;
import java.time.Duration;
import java.util.*;
import java.util.function.Supplier;

import static com.google.common.collect.Maps.newLinkedHashMap;
import static org.lowcoder.sdk.exception.PluginCommonError.*;
import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.getIdenticalColumns;
import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.querySharedScheduler;
import static org.lowcoder.sdk.plugin.common.sql.ResultSetParser.parseColumns;
import static org.lowcoder.sdk.plugin.common.sql.ResultSetParser.parseRows;
import static org.lowcoder.sdk.util.JsonUtils.toJson;
import static org.lowcoder.sdk.util.MustacheHelper.*;

@Slf4j
@Extension
public class ClickHouseQueryExecutor implements QueryExecutor<ClickHouseDatasourceConfig, HikariDataSource, SqlBasedQueryExecutionContext> {

    private final Supplier<Duration> getStructureTimeout;

    public ClickHouseQueryExecutor(ConfigCenter configCenter) {
        this.getStructureTimeout = configCenter.clickHousePlugin().ofInteger("getStructureTimeoutMillis", 8000)
                .then(Duration::ofMillis);
    }

    @Override
    public SqlBasedQueryExecutionContext buildQueryExecutionContext(ClickHouseDatasourceConfig datasourceConfig,
            Map<String, Object> queryConfigMap,
            Map<String, Object> requestParams, QueryVisitorContext queryVisitorContext) {

        ClickHouseQueryConfig queryConfig = ClickHouseQueryConfig.from(queryConfigMap);

        String query = SqlQueryUtils.removeQueryComments(queryConfig.getSql().trim());
        if (StringUtils.isBlank(query)) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "SQL_EMPTY");
        }

        if (!datasourceConfig.isEnableTurnOffPreparedStatement() && queryConfig.isDisablePreparedStatement()) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "CLICKHOUSE_PS_ERROR");
        }

        return SqlBasedQueryExecutionContext.builder()
                .query(query)
                .requestParams(requestParams)
                .disablePreparedStatement(datasourceConfig.isEnableTurnOffPreparedStatement() &&
                        queryConfig.isDisablePreparedStatement())
                .build();
    }

    @Override
    public Mono<QueryExecutionResult> executeQuery(HikariDataSource hikariDataSource, SqlBasedQueryExecutionContext queryExecutionContext) {

        String query = queryExecutionContext.getQuery();
        Map<String, Object> requestParams = queryExecutionContext.getRequestParams();
        boolean preparedStatement = !queryExecutionContext.isDisablePreparedStatement();

        return Mono.fromSupplier(() -> executeQuery0(hikariDataSource, query, requestParams, preparedStatement))
                .onErrorMap(e -> {
                    if (e instanceof PluginException) {
                        return e;
                    }
                    return new PluginException(QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", e.getMessage());
                })
                .subscribeOn(querySharedScheduler());
    }

    @Override
    public Mono<DatasourceStructure> getStructure(HikariDataSource hikariDataSource,
            ClickHouseDatasourceConfig connectionConfig) {

        return Mono.fromCallable(() -> {
                    Connection connection = getConnection(hikariDataSource);

                    Map<String, Table> tablesByName = new LinkedHashMap<>();
                    try (Statement statement = connection.createStatement()) {
                        ClickHouseStructureParser.parseTableAndColumns(tablesByName, statement);
                    } catch (SQLException throwable) {
                        throw new PluginException(DATASOURCE_GET_STRUCTURE_ERROR, "DATASOURCE_GET_STRUCTURE_ERROR",
                                throwable.getMessage());
                    } finally {
                        releaseResources(connection);
                    }

                    DatasourceStructure structure = new DatasourceStructure(new ArrayList<>(tablesByName.values()));
                    for (Table table : structure.getTables()) {
                        table.getKeys().sort(Comparator.naturalOrder());
                    }
                    return structure;
                })
                .timeout(getStructureTimeout.get())
                .subscribeOn(querySharedScheduler());
    }

    private QueryExecutionResult executeQuery0(HikariDataSource hikariDataSource, String query,
            Map<String, Object> requestParams,
            boolean isPreparedStatement) {

        List<String> mustacheKeysInOrder = extractMustacheKeysInOrder(query);

        Statement statement = null;
        ResultSet resultSet = null;
        PreparedStatement preparedQuery = null;
        boolean isResultSet;

        Connection connection = getConnection(hikariDataSource);
        try {
            if (isPreparedStatement) {
                var preparedSql = doPrepareStatement(query, mustacheKeysInOrder, requestParams);
                preparedQuery = connection.prepareStatement(preparedSql);
                bindPreparedStatementParams(preparedQuery,
                        mustacheKeysInOrder,
                        requestParams
                );

                isResultSet = preparedQuery.execute();
                resultSet = preparedQuery.getResultSet();
            } else {
                statement = connection.createStatement();
                isResultSet = statement.execute(renderMustacheString(query, requestParams), Statement.RETURN_GENERATED_KEYS);
                resultSet = statement.getResultSet();
            }

            return parseExecuteResult(isPreparedStatement, statement, resultSet, preparedQuery, isResultSet);

        } catch (SQLException e) {
            throw new PluginException(QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", e.getMessage());
        } finally {
            releaseResources(connection, statement, resultSet, preparedQuery);
        }
    }

    private QueryExecutionResult parseExecuteResult(boolean preparedStatement, Statement statement,
            ResultSet resultSet, PreparedStatement preparedQuery, boolean isResultSet) throws SQLException {

        if (isResultSet) {
            ResultSetMetaData metaData = resultSet.getMetaData();
            List<Map<String, Object>> dataRows = parseRows(resultSet);

            List<String> columnLabels = parseColumns(metaData);
            return QueryExecutionResult.success((dataRows), getHintMessages(columnLabels));
        }

        Object affectedRows = preparedStatement ? Math.max(preparedQuery.getUpdateCount(), 0) // might return -1
                                                : Math.max(statement.getUpdateCount(), 0);
        Map<String, Object> result = newLinkedHashMap();
        result.put("affectedRows", affectedRows);
        return QueryExecutionResult.success(result);
    }

    private List<LocaleMessage> getHintMessages(List<String> columnNames) {
        List<LocaleMessage> messages = new ArrayList<>();
        List<String> identicalColumns = getIdenticalColumns(columnNames);
        if (CollectionUtils.isNotEmpty(identicalColumns)) {
            messages.add(new LocaleMessage("DUPLICATE_COLUMN", String.join("/", identicalColumns)));
        }
        return messages;
    }

    private void bindPreparedStatementParams(PreparedStatement preparedStatement, List<String> mustacheKeysInOrder,
            Map<String, Object> requestParams) {

        try {
            for (int index = 0; index < mustacheKeysInOrder.size(); index++) {

                String mustacheKey = mustacheKeysInOrder.get(index);
                Object value = requestParams.get(mustacheKey);

                int bindIndex = index + 1;
                if (value == null) {
                    preparedStatement.setNull(bindIndex, Types.NULL);
                    continue;
                }
                if (value instanceof Integer intValue) {
                    preparedStatement.setInt(bindIndex, intValue);
                    continue;
                }
                if (value instanceof Long longValue) {
                    preparedStatement.setLong(bindIndex, longValue);
                    continue;
                }
                if (value instanceof Float || value instanceof Double) {
                    preparedStatement.setBigDecimal(bindIndex, new BigDecimal(String.valueOf(value)));
                    continue;
                }
                if (value instanceof Boolean boolValue) {
                    preparedStatement.setBoolean(bindIndex, boolValue);
                    continue;
                }
                if (value instanceof Map<?, ?> || value instanceof Collection<?>) {
                    preparedStatement.setString(bindIndex, toJson(value));
                    continue;
                }
                if (value instanceof String strValue) {
                    preparedStatement.setString(bindIndex, strValue);
                    continue;
                }
                throw new PluginException(PREPARED_STATEMENT_BIND_PARAMETERS_ERROR, "PS_BIND_ERROR",
                        mustacheKey, value.getClass().getSimpleName());
            }
        } catch (Exception e) {
            if (e instanceof PluginException pluginException) {
                throw pluginException;
            }
            throw new PluginException(PREPARED_STATEMENT_BIND_PARAMETERS_ERROR, "PREPARED_STATEMENT_BIND_PARAMETERS_ERROR", e.getMessage());
        }
    }

    private void releaseResources(AutoCloseable... autoCloseables) {
        for (AutoCloseable closeable : autoCloseables) {
            if (closeable != null) {
                try {
                    closeable.close();
                } catch (Exception e) {
                    log.error("close {} error", closeable.getClass().getSimpleName(), e);
                }
            }
        }
    }

    private Connection getConnection(HikariDataSource hikariDataSource) {
        Connection connection;
        try {
            if (hikariDataSource == null || hikariDataSource.isClosed() || !hikariDataSource.isRunning()) {
                throw new InvalidHikariDatasourceException();
            }
            connection = hikariDataSource.getConnection();
        } catch (SQLException e) {
            throw new PluginException(CONNECTION_ERROR, "CONNECTION_ERROR", e.getMessage());
        }
        return connection;
    }

}
