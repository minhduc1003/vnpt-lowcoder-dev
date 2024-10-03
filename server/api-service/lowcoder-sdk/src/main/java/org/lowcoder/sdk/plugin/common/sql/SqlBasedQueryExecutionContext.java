package org.lowcoder.sdk.plugin.common.sql;

import lombok.Builder;
import lombok.Getter;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.query.QueryExecutionContext;

import java.util.Map;

import static org.apache.commons.collections4.MapUtils.emptyIfNull;

@Getter
public class SqlBasedQueryExecutionContext extends QueryExecutionContext {

    private final String query;
    private final Map<String, Object> requestParams;
    private final boolean disablePreparedStatement;
    private final GuiSqlCommand guiSqlCommand;

    @Builder
    private SqlBasedQueryExecutionContext(String query, Map<String, Object> requestParams, boolean disablePreparedStatement,
            GuiSqlCommand guiSqlCommand) {
        this.query = query;
        this.requestParams = requestParams;
        this.disablePreparedStatement = disablePreparedStatement;
        this.guiSqlCommand = guiSqlCommand;
    }

    public Map<String, Object> getRequestParams() {
        return emptyIfNull(requestParams);
    }

    public SqlBasedQueryExecutionContextBuilder toBuilder() {
        return SqlBasedQueryExecutionContext.builder()
                .query(query)
                .requestParams(requestParams)
                .disablePreparedStatement(disablePreparedStatement)
                .guiSqlCommand(guiSqlCommand);
    }
}
