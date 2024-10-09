import { withExposingConfigs } from "comps/generators/withExposing";
import { UICompBuilder, withDefault } from "comps/generators";
import {
  controlItem,
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
import { useCallback, useMemo, useState } from "react";
import { languageList } from "@lowcoder-ee/i18n";
import { useDispatch } from "react-redux";
import { updateUserAction } from "@lowcoder-ee/redux/reduxActions/userActions";
import { MenuProps, Space, Table, Tag } from "antd";
import { TableColItemListComp } from "./tableColComp";
import { genRandomKey } from "@lowcoder-ee/index.sdk";
import { menuPropertyView } from "../navComp/components/MenuItemList";

const { Column, ColumnGroup } = Table;
const childrenMap = {
  size: withDefault(StringControl, "20px"),
  items: withDefault(TableColItemListComp, [
    {
      label: "item" + " 1",
      itemKey: genRandomKey(),
    },
  ]),
};
interface DataType {
  key: React.Key;
  firstName: string;
  lastName: string;
  age: number;
  address: string;
  tags: string[];
}

const data: DataType[] = [
  {
    key: "1",
    firstName: "John",
    lastName: "Brown",
    age: 32,
    address: "New York No. 1 Lake Park",
    tags: ["nice", "developer"],
  },
  {
    key: "2",
    firstName: "Jim",
    lastName: "Green",
    age: 42,
    address: "London No. 1 Lake Park",
    tags: ["loser"],
  },
  {
    key: "3",
    firstName: "Joe",
    lastName: "Black",
    age: 32,
    address: "Sydney No. 1 Lake Park",
    tags: ["cool", "teacher"],
  },
];
const TableNewCompBase = new UICompBuilder(childrenMap, (props) => {
  const getMenuItem = useCallback((itemComps: any[]): any => {
    return itemComps.map((item) => {
      const label = item.children.label.getView();
      const subItems = item.children.items.getView();
      return {
        label: label,
        key: item.getItemKey(),
        ...(subItems.length > 0 && { children: getMenuItem(subItems) }),
      };
    });
  }, []);
  const menuItems = useMemo(() => {
    return getMenuItem(props.items);
  }, [props.items, getMenuItem]);
  console.log(menuItems);
  return (
    <>
      <Table<DataType> dataSource={data}>
        {menuItems.map((item: any) =>
          item.children ? (
            <ColumnGroup title={item.label}>
              {item.children.map((subItem: any) => (
                <Column
                  title={subItem.label}
                  dataIndex={subItem.label}
                  key={subItem.label}
                />
              ))}
            </ColumnGroup>
          ) : (
            <Column
              title={item.label}
              dataIndex={item.label}
              key={item.label}
            />
          )
        )}
      </Table>
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
        <Section name="items">
          {menuPropertyView(children.items as any)}
        </Section>
      </>
    );
  })
  .build();

export const TableNewComp = withExposingConfigs(TableNewCompBase, []);
