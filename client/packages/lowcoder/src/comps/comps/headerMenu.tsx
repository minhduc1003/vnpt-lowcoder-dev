import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { UICompBuilder, withDefault } from "comps/generators";
import { controlItem, data, Section, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import {
  clickEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";
import { StringControl } from "comps/controls/codeControl";
import { alignWithJustifyControl } from "comps/controls/alignControl";

import { default as DownOutlined } from "@ant-design/icons/DownOutlined";
import { default as Dropdown } from "antd/es/dropdown";
import { default as Menu, MenuProps } from "antd/es/menu";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { styleControl } from "comps/controls/styleControl";
import {
  AnimationStyle,
  AnimationStyleType,
  NavigationStyle,
  NavLayoutItemActiveStyle,
  NavLayoutItemActiveStyleType,
  NavLayoutItemHoverStyle,
  NavLayoutItemHoverStyleType,
  NavLayoutItemStyle,
  NavLayoutItemStyleType,
  NavLayoutStyle,
} from "comps/controls/styleControlConstants";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";

import { useCallback, useContext, useMemo, useState } from "react";
import { EditorContext } from "comps/editorState";
import {
  AppstoreOutlined,
  MailOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import { genRandomKey, HeaderMenuOptionControl } from "@lowcoder-ee/index.sdk";
import Item from "antd/es/list/Item";
import Segmented from "@lowcoder-ee/components/Segmented";

type MenuItemStyleOptionValue = "normal" | "hover" | "active";
type HeaderMenuComp = Required<MenuProps>["items"][number];
const childrenMap = {
  options: HeaderMenuOptionControl,
};

const HeaderMenuCompBase = new UICompBuilder(childrenMap, (props) => {
  const [menuActive, setMenuActive] = useState(false);
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        onClick={() => setMenuActive(!menuActive)}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </svg>
      <div
        style={{
          padding: "10px 20px",
          position: "absolute",
          right: "0",
          top: "50px",
          borderRadius: "10px",
          display: `${menuActive ? "flex" : "none"}`,
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          zIndex: 100,
          boxShadow:
            "rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px",
        }}
      >
        {props.options?.map((item: any) => (
          <div
            key={item?.label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => item.onEvent("click")}
          >
            {item?.icon != "" && (
              <img
                src={item?.icon}
                alt=""
                style={{ width: "50px", height: "50px", borderRadius: "100%" }}
              />
            )}
            <p
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item?.label}
            </p>
          </div>
        ))}
      </div>
    </>
  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={"data"}>{children.options.propertyView({})}</Section>
      </>
    );
  })
  .build();

export const HeaderMenuComp = withExposingConfigs(HeaderMenuCompBase, []);
