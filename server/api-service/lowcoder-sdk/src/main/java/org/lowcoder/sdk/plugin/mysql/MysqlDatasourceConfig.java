package org.lowcoder.sdk.plugin.mysql;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;

import java.util.Map;

import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

@Slf4j
@SuperBuilder
@Jacksonized
public class MysqlDatasourceConfig extends SqlBasedDatasourceConnectionConfig {

    private static final long DEFAULT_PORT = 3306L;

    @Override
    protected long defaultPort() {
        return DEFAULT_PORT;
    }

    @JsonCreator
    public MysqlDatasourceConfig(String database, String username, String password, String host, Long port, boolean usingSsl, String serverTimezone, boolean isReadonly, boolean enableTurnOffPreparedStatement, Map<String, Object> extParams) {
        super(database, username, password, host, port, usingSsl, serverTimezone, isReadonly, enableTurnOffPreparedStatement, extParams);
    }

    public static MysqlDatasourceConfig buildFrom(Map<String, Object> requestMap) {
        MysqlDatasourceConfig result = fromJson(toJson(requestMap), MysqlDatasourceConfig.class);
        if (result == null) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "INVALID_MYSQL_CONFIG");
        }
        return result;
    }
}
