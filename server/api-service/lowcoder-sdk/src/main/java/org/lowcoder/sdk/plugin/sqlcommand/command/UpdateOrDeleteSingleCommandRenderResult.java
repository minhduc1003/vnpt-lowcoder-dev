package org.lowcoder.sdk.plugin.sqlcommand.command;

import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.GuiSqlCommandRenderResult;

import java.util.List;

public class UpdateOrDeleteSingleCommandRenderResult extends GuiSqlCommandRenderResult {
    private final String selectQuery;
    private final List<Object> selectBindParams;

    public UpdateOrDeleteSingleCommandRenderResult(String selectQuery, List<Object> selectBindParams, String updateOrDeleteSql,
            List<Object> updateBindParams) {
        super(updateOrDeleteSql, updateBindParams);
        this.selectQuery = selectQuery;
        this.selectBindParams = selectBindParams;
    }

    public String getSelectQuery() {
        return selectQuery;
    }

    public List<Object> getSelectBindParams() {
        return selectBindParams;
    }
}