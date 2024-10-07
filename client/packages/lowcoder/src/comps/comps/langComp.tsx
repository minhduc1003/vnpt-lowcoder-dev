import { withExposingConfigs } from "comps/generators/withExposing";
import { UICompBuilder, withDefault } from "comps/generators";
import {
  controlItem,
  data,
  Flag_us,
  Flag_vi,
  Flag_vn,
  Section,
  sectionNames,
} from "lowcoder-design";
import styled from "styled-components";
import { StringControl } from "comps/controls/codeControl";
import { default as DownOutlined } from "@ant-design/icons/DownOutlined";
import { default as Dropdown } from "antd/es/dropdown";
import { Menu, MenuProps, Space } from "antd";
import { useState } from "react";
import { languageList } from "@lowcoder-ee/i18n";
import { useDispatch } from "react-redux";
import { updateUserAction } from "@lowcoder-ee/redux/reduxActions/userActions";

const childrenMap = {
  url: withDefault(StringControl, ""),
};

const LangCompBase = new UICompBuilder(childrenMap, (props) => {
  const dispatch = useDispatch();

  const [selectedLanguage, setSelectedLanguage] = useState(
    languageList.find(
      (lang: any) =>
        lang.languageCode === localStorage.getItem("lowcoder_uiLanguage")
    )
  );

  const handleLanguageChange = (languageCode: any) => {
    const selectedLang = languageList.find(
      (lang: any) => lang.languageCode === languageCode
    );
    setSelectedLanguage(selectedLang);
    dispatch(updateUserAction({ uiLanguage: languageCode }));
    localStorage.setItem("lowcoder_uiLanguage", languageCode);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  const menu = (
    <Menu>
      {languageList.map((lang) => (
        <Menu.Item
          key={lang.languageCode}
          onClick={() => handleLanguageChange(lang.languageCode)}
        >
          <Space>
            <lang.flag width={"16px"} />
            {lang.languageName}
          </Space>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu}>
        <Space>
          {selectedLanguage && (
            <selectedLanguage.flag
              width={"30px"}
              height={"30px"}
              style={{ borderRadius: "10px" }}
            />
          )}
          <DownOutlined />
        </Space>
      </Dropdown>
    </>
  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name="url">
          {children.url.propertyView({
            label: "URL",
          })}
        </Section>
      </>
    );
  })
  .build();

export const LangComp = withExposingConfigs(LangCompBase, []);
