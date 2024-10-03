import { default as Badge } from "antd/es/badge";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { trans } from "i18n";
import { StringControl, stringUnionControl } from "comps/controls/codeControl";
import { DropdownStyled, Wrapper } from "./columnTagsComp";
import { ReactNode, useContext, useState } from "react";
import { StatusContext } from "components/table/EditableCell";
import { CustomSelect, PackUpIcon, ScrollBar } from "lowcoder-design";
import { PresetStatusColorType } from "antd/es/_util/colors";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

export const BadgeStatusOptions = [
  "none",
  "success",
  "error",
  "default",
  "warning",
  "processing",
] as const;

export type StatusType = PresetStatusColorType | "none";

const childrenMap = {
  text: StringControl,
  status: stringUnionControl(BadgeStatusOptions, "none"),
};

const getBaseValue: ColumnTypeViewFn<
  typeof childrenMap,
  { value: string; status: StatusType },
  { value: string; status: StatusType }
> = (props) => ({
  value: props.text,
  status: props.status,
});

type StatusEditPropsType = {
  value: { value: string; status: StatusType };
  onChange: (value: { value: string; status: StatusType }) => void;
  onChangeEnd: () => void;
};

const StatusEdit = (props: StatusEditPropsType) => {
  const defaultStatus = useContext(StatusContext);
  const [status, setStatus] = useState(defaultStatus);
  const [allOptions, setAllOptions] = useState(BadgeStatusOptions);
  const [open, setOpen] = useState(false);

  return (
    <Wrapper>
      <CustomSelect
        autoFocus
        defaultOpen
        variant="borderless"
        optionLabelProp="children"
        open={open}
        defaultValue={props.value.value}
        style={{ width: "100%" }}
        suffixIcon={<PackUpIcon />}
        showSearch
        onSearch={(value: string) => {
          if (defaultStatus.findIndex((item) => item.text.includes(value)) < 0) {
            setStatus([
              ...defaultStatus,
              {
                text: value,
                status: "none",
              },
            ]);
          } else {
            setStatus(defaultStatus);
          }
          props.onChange({
            value,
            status: status.find((item) => item.text === value)?.status || "none",
          });
        }}
        onChange={(value: string) => {
          props.onChange({
            value,
            status: status.find((item) => item.text === value)?.status || "none",
          });
          setOpen(false)
        }}
        dropdownRender={(originNode: ReactNode) => (
          <DropdownStyled>
            <ScrollBar style={{ maxHeight: "256px" }}>{originNode}</ScrollBar>
          </DropdownStyled>
        )}
        dropdownStyle={{ marginTop: "7px", padding: "8px 0 6px 0" }}
        onBlur={() => {
          props.onChangeEnd();
          setOpen(false);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onClick={() => setOpen(!open)}
      >
        {allOptions.map((value, index) => (
          <CustomSelect.Option value={value} key={index}>
            {value === "none" ? (
              value
            ) : (
              <Badge status={value} text={value} />
            )}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </Wrapper>
  );
};

export const BadgeStatusComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const text = props.changeValue?.value ?? getBaseValue(props, dispatch).value;
      const status = props.changeValue?.status ?? getBaseValue(props, dispatch).status;
      return status === "none" ? text : <Badge status={status} text={text}/>;
    },
    (nodeValue) => [nodeValue.status.value, nodeValue.text.value].filter((t) => t).join(" "),
    getBaseValue
  )
    .setEditViewFn((props) => {
      return (
        <StatusEdit value={props.value} onChange={props.onChange} onChangeEnd={props.onChangeEnd} />
      );
    })
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.status.propertyView({
            label: trans("table.status"),
            tooltip: trans("table.statusTooltip"),
          })}
        </>
      );
    })
    .build();
})();
