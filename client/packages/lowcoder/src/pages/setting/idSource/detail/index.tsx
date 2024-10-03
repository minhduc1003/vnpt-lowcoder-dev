import React, { useEffect, useState } from "react";
import { trans, transToNode } from "i18n";
import IdSourceApi, { ConfigItem } from "api/idSourceApi";
import { DetailContainer } from "pages/setting/theme/styledComponents";
import { HeaderBack } from "pages/setting/permission/styledComponents";
import {
  ArrowIcon,
  CustomModal,
  CustomSelect,
  LockIcon,
  UnLockIcon,
  CloseEyeIcon,
} from "lowcoder-design";
import history from "util/history";
import { OAUTH_PROVIDER_SETTING } from "constants/routesURL";
import {
  authConfig,
  AuthType,
  ManualSyncTypes,
} from "@lowcoder-ee/pages/setting/idSource/idSourceConstants";
import { Manual } from "pages/setting/idSource/detail/manual";
import { DeleteConfig } from "pages/setting/idSource/detail/deleteConfig";
import { default as Divider } from "antd/es/divider";
import { default as Form } from "antd/es/form";
import { useForm } from "antd/es/form/Form";
import { default as Input } from "antd/es/input";
import { default as Tooltip } from "antd/es/tooltip";
import {
  SaveButton,
  CheckboxStyled,
  FormStyled,
  PasswordLabel,
  Content,
  Header,
} from "pages/setting/idSource/styledComponents";
import { validateResponse } from "api/apiUtils";
import { ItemType } from "pages/setting/idSource/idSourceConstants";
import _ from "lodash";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { IconPicker } from "@lowcoder-ee/comps/controls/iconControl";
import Switch from "antd/es/switch";
import Title from "antd/es/typography/Title";
import { sourceMappingKeys } from "../OAuthForms/GenericOAuthForm";
import Flex from "antd/es/flex";

type IdSourceDetailProps = {
  location: Location & { state: ConfigItem };
};

export const IdSourceDetail = (props: IdSourceDetailProps) => {
  const configDetail = props.location.state;
  const [form] = useForm();
  const [lock, setLock] = useState(() => {
    const config = props.location.state;
    return !config.ifLocal;
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveDisable, setSaveDisable] = useState(() => {
    const config = props.location.state;
    if (
      (config.authType === AuthType.Form && !config.enable) ||
      (!config.ifLocal && !config.enable)
    ) {
      return false;
    } else {
      return true;
    }
  });

  useEffect(() => {
    if (configDetail.authType === AuthType.Generic) {
      sourceMappingKeys.forEach((sourceKey) => {
        form.setFieldValue(sourceKey, (configDetail as any).sourceMappings[sourceKey]);
      })
    }
  }, [configDetail]);
  const goList = () => {
    history.push(OAUTH_PROVIDER_SETTING);
  };
  if (!configDetail) {
    goList();
  }
  const handleSuccess = (values: any) => {
    setSaveLoading(true);
    let params = {
      id: configDetail.id,
      authType: configDetail.authType,
      enableRegister: configDetail.enableRegister,
    };

    if (configDetail.authType === AuthType.Generic) {
      const { uid, email, avatar, username, ...newValues } = values;
      params = {
        ...newValues,
        sourceMappings: {
          uid,
          email,
          avatar,
          username,
        },
        ...params,
      }
    } else {
      params = {
        ...values,
        ...params,
      }
    }
    IdSourceApi.saveConfig(params)
      .then((resp) => {
        if (validateResponse(resp)) {
          messageInstance.success(trans("idSource.saveSuccess"), 0.8, goList);
        }
      })
      .catch((e) => messageInstance.error(e.message))
      .finally(() => setSaveLoading(false));
  };

  const handleChange = (allValues: { [key: string]: string }) => {
    let ifChange = false;
    let ifError = false;
    for (const key in allValues) {
      const item = configDetail[key as keyof ConfigItem];
      if (allValues[key] !== item && (allValues[key] || item)) {
        ifChange = true;
      }
    }
    const requiredValues = {} as { [key: string]: string };
    Object.entries(authConfig[configDetail.authType].form).forEach(([key, value]) => {
      if (typeof value === "string" || value.isRequire !== false) {
        key in allValues && (requiredValues[key] = allValues[key]);
      }
    });
    if (configDetail.ifLocal) {
      ifError =
        Object.values(requiredValues).findIndex((item) => item === "" || item === undefined) >= 0;
    } else {
      for (const key in requiredValues) {
        const value = requiredValues[key as string];
        if (
          key !== "clientSecret" &&
          key !== "publicKey" &&
          (value === "" || value === undefined || value === null)
        ) {
          ifError = true;
        }
      }
    }
    if (
      (configDetail.authType === AuthType.Form && !configDetail.enable) ||
      (!configDetail.ifLocal && !configDetail.enable && !ifError) ||
      (ifChange && !ifError)
    ) {
      setSaveDisable(false);
    } else {
      setSaveDisable(true);
    }
  };

  const handleLockClick = () => {
    CustomModal.confirm({
      title: trans("idSource.disableTip"),
      content: trans("idSource.lockModalContent"),
      onConfirm: () => setLock(false),
    });
  };
  return (
    <DetailContainer>
      <Header>
        <HeaderBack>
          <span onClick={() => goList()}>{trans("idSource.title")}</span>
          <ArrowIcon />
          <span>{authConfig[configDetail.authType].sourceName}</span>
        </HeaderBack>
      </Header>
      <Content>
        <FormStyled
          form={form}
          name="basic"
          layout="vertical"
          style={{ maxWidth: 440 }}
          initialValues={configDetail}
          onFinish={(values) => handleSuccess(values as ConfigItem)}
          autoComplete="off"
          onValuesChange={(changedValues, allValues) =>
            handleChange(allValues as { [key: string]: string })
          }
        >
          {Object.entries(authConfig[configDetail.authType].form).map(([key, value]) => {
            const valueObject = _.isObject(value) ? (value as ItemType) : false;
            // let required = configDetail.ifLocal || (key !== "clientSecret" && key !== "publicKey");
            let required = (key === "clientId" || key === "clientSecret" || key === "scope");
            required = valueObject ? valueObject.isRequire ?? required : required;
            const hasLock = valueObject && valueObject?.hasLock;
            const tip = valueObject && valueObject.tip;
            const label = valueObject ? valueObject.label : value as string;
            const isList = valueObject && valueObject.isList;
            const isPassword = valueObject && valueObject.isPassword;
            const isIcon = valueObject && valueObject.isIcon;
            const isSwitch = valueObject && valueObject.isSwitch;
            return (
              <div key={key}>
                <Form.Item
                  key={key}
                  name={key}
                  className={hasLock && lock ? "lock" : ""}
                  rules={[
                    {
                      required,
                      message: isList
                        ? trans("idSource.formSelectPlaceholder", {
                            label,
                          })
                        : trans("idSource.formPlaceholder", {
                            label,
                          }),
                    },
                  ]}
                  label={
                    isPassword ? (
                      <PasswordLabel>
                        <span>{label}:</span>
                        <CloseEyeIcon />
                      </PasswordLabel>
                    ) : (
                      <Tooltip title={tip}>
                        <span className={tip ? "has-tip" : ""}>{label}</span>:
                      </Tooltip>
                    )
                  }
                >
                  {isPassword ? (
                    <Input
                      type={"password"}
                      placeholder={
                        configDetail.ifLocal
                          ? trans("idSource.formPlaceholder", {
                              label,
                            })
                          : trans("idSource.encryptedServer")
                      }
                      autoComplete={"one-time-code"}
                    />
                  ) : isSwitch ? (
                    <Switch />
                  ) : isIcon ? (
                    <IconPicker
                      onChange={(value) => form.setFieldValue("sourceIcon", value)}
                      label={'Source Icon'}
                      value={form.getFieldValue('sourceIcon')}
                    />
                  ) : isList ? (
                    <CustomSelect
                      options={(value as ItemType).options}
                      placeholder={trans("idSource.formSelectPlaceholder", {
                        label,
                      })}
                    />
                  ) : (
                    <Input
                      placeholder={trans("idSource.formPlaceholder", {
                        label,
                      })}
                      disabled={hasLock && lock}
                      prefix={
                        hasLock &&
                        (lock ? <LockIcon onClick={() => handleLockClick()} /> : <UnLockIcon />)
                      }
                    />
                  )}
                </Form.Item>
                {hasLock && lock && (
                  <span className="lock-tip">
                    {transToNode("idSource.lockTip", { icon: <LockIcon /> })}
                  </span>
                )}
              </div>
            );
          })}
          {/* <Form.Item className="register" name="enableRegister" valuePropName="checked">
            <CheckboxStyled>{trans("idSource.enableRegister")}</CheckboxStyled>
          </Form.Item> */}

          {configDetail.authType === AuthType.Generic &&  (
            <>
              <Title level={5}>Source Mappings</Title>
              {sourceMappingKeys.map(sourceKey => (
                <Flex gap="10px" align="start" key={sourceKey} >
                  <Input
                    readOnly
                    disabled
                    value={sourceKey}
                    style={{flex: 1}}
                  />
                  <span> &#8594; </span>
                  <Form.Item
                    name={sourceKey}
                    rules={[{ required: true }]}
                    style={{flex: 1}}
                  >
                    <Input
                      placeholder={trans("idSource.formPlaceholder", {
                        label: sourceKey,
                      })}
                    />
                  </Form.Item>
                </Flex>
              ))}
            </>
          )}

          <Form.Item>
            <SaveButton loading={saveLoading} disabled={saveDisable} htmlType="submit">
              {configDetail.enable ? trans("idSource.save") : trans("idSource.saveBtn")}
            </SaveButton>
          </Form.Item>
        </FormStyled>
        {ManualSyncTypes.includes(configDetail.authType) && (
          <>
            <Divider />
            <Manual type={configDetail.authType} />
          </>
        )}
        {configDetail.enable && (
          <>
            <Divider />
            <DeleteConfig id={configDetail.id} />
          </>
        )}
      </Content>
    </DetailContainer>
  );
};
