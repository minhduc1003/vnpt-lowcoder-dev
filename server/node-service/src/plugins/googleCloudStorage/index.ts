import { S3ServiceException } from "@aws-sdk/client-s3";
import { ServiceError } from "../../common/error";
import _ from "lodash";
import { PluginContext } from "lowcoder-sdk/dataSource";
import queryConfig, { ActionDataType } from "./queryConfig";
import { DataSourceDataType } from "./dataSourceConfig";
import run, { validateDataSourceConfig } from "./run";
import { dataSourceConfig } from "./dataSourceConfig";
import { version2spec } from "../../common/util";

const specs = {
  "v1.0": queryConfig
}
const gcsPlugin = {
  id: "googleCloudStorage",
  name: "Google Cloud Storage",
  icon: "gcs.svg",
  category: "Assets",
  dataSourceConfig,
  queryConfig: async (data: any) => {
    return version2spec(specs, data.specVersion);
  },

  validateDataSourceConfig: async (dataSourceConfig: DataSourceDataType) => {
    return validateDataSourceConfig(dataSourceConfig);
  },

  run: async (action: ActionDataType, dataSourceConfig: DataSourceDataType, ctx: PluginContext) => {
    try {
      return await run(action, dataSourceConfig);
    } catch (e) {
      if (e instanceof S3ServiceException) {
        throw new ServiceError(e.message, 400);
      }
      throw e;
    }
  },
};

export default gcsPlugin;
