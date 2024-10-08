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
const DropdownStyled = styled(Dropdown)`
  scrollbar-width: none;
  -ms-overflow-style: none;
`;
const childrenMap = {
  size: withDefault(StringControl, "20px"),
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
      <DropdownStyled overlay={menu}>
        <Space>
          {selectedLanguage && (
            <selectedLanguage.flag
              width={props.size}
              height={props.size}
              style={{ borderRadius: "10px" }}
            />
          )}
          <DownOutlined style={{ width: "10px", height: "10px" }} />
        </Space>
      </DropdownStyled>
    </>
  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name="size">
          {children.size.propertyView({
            label: "size",
          })}
        </Section>
      </>
    );
  })
  .build();

export const LangComp = withExposingConfigs(LangCompBase, []);
