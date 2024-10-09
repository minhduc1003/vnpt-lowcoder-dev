import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { UICompBuilder, withDefault } from "comps/generators";
import { controlItem, Section } from "lowcoder-design";
import styled from "styled-components";
import { navListComp } from "./navItemComp";
import { menuPropertyView } from "./components/MenuItemList";
import { default as Menu, MenuProps } from "antd/es/menu";
import { styleControl } from "comps/controls/styleControl";
import {
  NavLayoutItemActiveStyle,
  NavLayoutItemActiveStyleType,
  NavLayoutItemHoverStyle,
  NavLayoutItemHoverStyleType,
  NavLayoutItemStyle,
  NavLayoutItemStyleType,
  NavLayoutStyle,
} from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import { useState } from "react";
import { genRandomKey } from "@lowcoder-ee/index.sdk";
import Segmented from "@lowcoder-ee/components/Segmented";
import { menuItemStyleOptions } from "../layout/navLayoutConstants";
type MenuItemStyleOptionValue = "normal" | "hover" | "active";
type NavColComp = Required<MenuProps>["items"][number];
const childrenMap = {
  items: withDefault(navListComp(), [
    {
      label: trans("menuItem") + " 1",
      itemKey: genRandomKey(),
    },
  ]),
  navStyle: styleControl(NavLayoutStyle, "navStyle"),
  navItemStyle: styleControl(NavLayoutItemStyle, "navItemStyle"),
  navItemHoverStyle: styleControl(NavLayoutItemHoverStyle, "navItemHoverStyle"),
  navItemActiveStyle: styleControl(
    NavLayoutItemActiveStyle,
    "navItemActiveStyle"
  ),
};
const StyledMenu = styled(Menu)<{
  $navItemStyle?: NavLayoutItemStyleType;
  $navItemHoverStyle?: NavLayoutItemHoverStyleType;
  $navItemActiveStyle?: NavLayoutItemActiveStyleType;
}>`
  @media only screen and (max-width: 768px) {
    .ant-menu-title-content {
      display: none;
    }
  }
  .ant-menu-title-content {
    margin-left: 10px;
  }
  .ant-menu-item {
    background-color: ${(props) => props.$navItemStyle?.background};
    color: ${(props) => props.$navItemStyle?.text};
    border-radius: ${(props) => props.$navItemStyle?.radius} !important;
    border: ${(props) => `1px solid ${props.$navItemStyle?.border}`};
  }
  .ant-menu-item-active {
    background-color: ${(props) =>
      props.$navItemHoverStyle?.background} !important;
    color: ${(props) => props.$navItemHoverStyle?.text} !important;
    border: ${(props) => `1px solid ${props.$navItemHoverStyle?.border}`};
  }
  .ant-menu-item-selected {
    background-color: ${(props) =>
      props.$navItemActiveStyle?.background} !important;
    color: ${(props) => props.$navItemActiveStyle?.text} !important;
    border: ${(props) => `1px solid ${props.$navItemActiveStyle?.border}`};
  }

  .ant-menu-submenu {
    .ant-menu-submenu-title {
      background-color: ${(props) => props.$navItemStyle?.background};
      color: ${(props) => props.$navItemStyle?.text};
      border-radius: ${(props) => props.$navItemStyle?.radius} !important;
      border: ${(props) => `1px solid ${props.$navItemStyle?.border}`};
    }

    &.ant-menu-submenu-active {
      > .ant-menu-submenu-title {
        background-color: ${(props) =>
          props.$navItemHoverStyle?.background} !important;
        color: ${(props) => props.$navItemHoverStyle?.text} !important;
        border: ${(props) => `1px solid ${props.$navItemHoverStyle?.border}`};
      }
    }
    &.ant-menu-submenu-selected {
      > .ant-menu-submenu-title {
        width: 100%;
        background-color: ${(props) =>
          props.$navItemActiveStyle?.background} !important;
        color: ${(props) => props.$navItemActiveStyle?.text} !important;
        border: ${(props) => `1px solid ${props.$navItemActiveStyle?.border}`};
      }
    }
  }
`;
const NavColCompBase = new UICompBuilder(childrenMap, (props) => {
  const data = props.items;
  const [selectedKey, setSelectedKey] = useState();
  const items = (
    <>
      {data.map((menuItem, idx) => {
        const { hidden, label, items, active, onEvent } = menuItem.getView();
        const icon = menuItem.children.icon.getView();
        if (hidden) {
          return null;
        }
        const visibleSubItems = items.filter(
          (item) => !item.children.hidden.getView()
        );
        const subMenuItems: Array<{ key: string; label: string; icon: any }> =
          [];
        const subMenuSelectedKeys: Array<string> = [];
        visibleSubItems.forEach((subItem, index) => {
          const key = index + "";
          subItem.children.active.getView() && subMenuSelectedKeys.push(key);
          subMenuItems.push({
            key: key,
            icon: subItem.children.icon.getView(),
            label: subItem.children.label.getView(),
          });
        });
        const handleClick = (e: any) => {
          setSelectedKey(e.key);
        };
        const item = (
          <StyledMenu
            mode="inline"
            onClick={handleClick}
            selectedKeys={[selectedKey as any]}
            $navItemActiveStyle={props.navItemActiveStyle}
            $navItemHoverStyle={props.navItemHoverStyle}
            $navItemStyle={props.navItemStyle}
          >
            {visibleSubItems.length == 0 && (
              <Menu.Item key={idx} onClick={() => onEvent("click")} icon={icon}>
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
                    icon={d.icon}
                  >
                    {d.label}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            )}
          </StyledMenu>
        );
        return item;
      })}
    </>
  );

  return <>{items}</>;
})
  .setPropertyViewFn((children) => {
    const [styleSegment, setStyleSegment] = useState("normal");

    return (
      <>
        <Section name={"Menu"}>{menuPropertyView(children?.items)}</Section>
        <Section name={trans("navLayout.navStyle")}>
          {children.navStyle.getPropertyView()}
        </Section>
        <Section name={trans("navLayout.navItemStyle")}>
          {controlItem(
            {},
            <Segmented
              block
              options={menuItemStyleOptions}
              value={styleSegment}
              onChange={(k) => setStyleSegment(k as MenuItemStyleOptionValue)}
            />
          )}
          {styleSegment === "normal" && children.navItemStyle.getPropertyView()}
          {styleSegment === "hover" &&
            children.navItemHoverStyle.getPropertyView()}
          {styleSegment === "active" &&
            children.navItemActiveStyle.getPropertyView()}
        </Section>
      </>
    );
  })
  .build();

export const NavColComp = withExposingConfigs(NavColCompBase, [
  new NameConfig("items", trans("navigation.itemsDesc")),
]);
