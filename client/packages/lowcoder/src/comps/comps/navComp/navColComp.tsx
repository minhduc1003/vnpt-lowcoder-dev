import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { UICompBuilder, withDefault } from "comps/generators";
import { Section, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import {
  clickEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";
import { StringControl } from "comps/controls/codeControl";
import { alignWithJustifyControl } from "comps/controls/alignControl";
import { navListComp } from "./navItemComp";
import { menuPropertyView } from "./components/MenuItemList";
import { default as DownOutlined } from "@ant-design/icons/DownOutlined";
import { default as Dropdown } from "antd/es/dropdown";
import { default as Menu, MenuProps } from "antd/es/menu";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { styleControl } from "comps/controls/styleControl";
import {
  AnimationStyle,
  AnimationStyleType,
  NavigationStyle,
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
import {
  LayoutMenuItemComp,
  LayoutMenuItemListComp,
} from "../layout/layoutMenuItemComp";
import { genRandomKey } from "@lowcoder-ee/index.sdk";
import Item from "antd/es/list/Item";

type NavColComp = Required<MenuProps>["items"][number];
const childrenMap = {
  logoUrl: StringControl,
  items: withDefault(navListComp(), [
    {
      label: trans("menuItem") + " 1",
      itemKey: genRandomKey(),
    },
  ]),
};

const NavColCompBase = new UICompBuilder(childrenMap, (props) => {
  const data = props.items;
  const [selectedKey, setSelectedKey] = useState();
  const items = (
    <>
      {data.map((menuItem, idx) => {
        const { hidden, label, items, active, onEvent } = menuItem.getView();
        if (hidden) {
          return null;
        }
        const visibleSubItems = items.filter(
          (item) => !item.children.hidden.getView()
        );
        const subMenuItems: Array<{ key: string; label: string }> = [];
        const subMenuSelectedKeys: Array<string> = [];
        visibleSubItems.forEach((subItem, index) => {
          const key = index + "";
          subItem.children.active.getView() && subMenuSelectedKeys.push(key);
          subMenuItems.push({
            key: key,
            label: subItem.children.label.getView(),
          });
        });
        console.log(label);
        console.log(subMenuItems);
        const handleClick = (e: any) => {
          setSelectedKey(e.key);
        };
        const item = (
          <Menu
            mode="inline"
            onClick={handleClick}
            selectedKeys={[selectedKey as any]}
          >
            {visibleSubItems.length == 0 && (
              <Menu.Item key={idx} onClick={() => onEvent("click")}>
                {label}
              </Menu.Item>
            )}
            {visibleSubItems.length > 0 && (
              <Menu.SubMenu title={label}>
                {subMenuItems.map((d, i) => (
                  <Menu.Item
                    key={i}
                    onClick={(e) => {
                      const { onEvent: onSubEvent } =
                        items[Number(e.key)]?.getView();
                      onSubEvent("click");
                    }}
                  >
                    {d.label}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            )}
          </Menu>
        );
        return item;
      })}
    </>
  );

  return <>{items}</>;
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={sectionNames.advanced}>
          {children.logoUrl.propertyView({
            label: trans("navigation.logoURL"),
            tooltip: trans("navigation.logoURLDesc"),
          })}
        </Section>
        <Section name={"Menu"}>{menuPropertyView(children?.items)}</Section>
      </>
    );
  })
  .build();

export const NavColComp = withExposingConfigs(NavColCompBase, [
  new NameConfig("logoUrl", ""),
]);
