import { PresetStatusColorType } from "antd/es/_util/colors";
import _ from "lodash";
import { changeChildAction, DispatchType } from "lowcoder-core";
import { constantColors } from "lowcoder-design/src/components/colorSelect/colorUtils";
import React, { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { JSONValue } from "util/jsonTypes";
import ColumnTypeView from "./columnTypeView";
import { TableCellContext } from "comps/comps/tableComp/tableContext";
import Tooltip from "antd/es/tooltip";

type StatusType = PresetStatusColorType | "none";
export const TABLE_EDITABLE_SWITCH_ON = true;
export const TagsContext = React.createContext<string[]>([]);
export const StatusContext = React.createContext<{ text: string; status: StatusType }[]>([]);
export type UpdateChangeSet<T> = (value: T) => void;

// a top-right triangle chip
const EditableChip = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;

  width: 0px;
  height: 0px;
  border: 4.5px solid transparent;
  border-radius: 2px;
  border-top-color: ${constantColors[1].color};
  border-right-color: ${constantColors[1].color};
`;

export interface CellProps {
  editable?: boolean;
  size?: string;
  candidateTags?: string[];
  candidateStatus?: { text: string; status: StatusType }[];
  textOverflow?: boolean;
  cellTooltip?: string;
  editMode?: string;
  onTableEvent?: (eventName: any) => void;
}

export type CellViewReturn = (props: CellProps) => ReactNode;
export type EditViewFn<T> = (props: {
  value: T;
  onChange: (value: T) => void;
  onChangeEnd: () => void;
}) => ReactNode;

const BorderDiv = styled.div`
  position: absolute;
  border: 1.5px solid #315efb;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
`;

const CellWrapper = ({
  children,
  tooltipTitle,
}: {
  children: ReactNode,
  tooltipTitle?: string,
}) => {
  if (tooltipTitle) {
    return (
      <Tooltip title={tooltipTitle} placement="topLeft">
        {children}
      </Tooltip>
    )
  }
  return (
    <>{children}</>
  )
};

interface EditableCellProps<T> extends CellProps {
  normalView: ReactNode;
  dispatch: DispatchType;

  editViewFn?: EditViewFn<T>;
  baseValue?: T;
  changeValue?: T | null;
}

export function EditableCell<T extends JSONValue>(props: EditableCellProps<T>) {
  const {
    dispatch,
    normalView,
    editViewFn,
    changeValue,
    baseValue,
    candidateTags,
    // tagColors
    candidateStatus,
    editMode,
    onTableEvent,
  } = props;
  const status = _.isNil(changeValue) ? "normal" : "toSave";
  const editable = editViewFn ? props.editable : false;
  const { isEditing, setIsEditing } = useContext(TableCellContext);
  const value = changeValue ?? baseValue!;
  const [tmpValue, setTmpValue] = useState<T | null>(value);
  const singleClickEdit = editMode === 'single'; 

  useEffect(() => {
    setTmpValue(value);
  }, [JSON.stringify(value)]);

  const onChange = useCallback(
    (value: T) => {
      setTmpValue(value);
    },
    [setTmpValue]
  );

  const onChangeEnd = useCallback(() => {
    setIsEditing(false);
    dispatch(
      changeChildAction(
        "changeValue",
        _.isNil(tmpValue) || _.isEqual(tmpValue, baseValue) ? null : tmpValue,
        false
      )
    );
    if(!_.isEqual(tmpValue, value)) {
      onTableEvent?.('columnEdited');
    }
  }, [dispatch, JSON.stringify(baseValue), JSON.stringify(tmpValue)]);

  const editView = useMemo(
    () => editViewFn?.({ value, onChange, onChangeEnd }) ?? <></>,
    [editViewFn, JSON.stringify(value), onChange, onChangeEnd]
  );

  const enterEditFn = useCallback(() => {
    if (editable) setIsEditing(true);
  }, [editable]);

  if (isEditing) {
    return (
      <>
        <BorderDiv className="editing-border" />
        <TagsContext.Provider value={candidateTags ?? []}>
          <StatusContext.Provider value={candidateStatus ?? []}>
            <div className="editing-wrapper">
              {editView}
            </div>
          </StatusContext.Provider>
        </TagsContext.Provider>
      </>
    );
  }
  
  return (
      <ColumnTypeView
        textOverflow={props.textOverflow}
      >
        {status === "toSave" && !isEditing && <EditableChip />}
        <CellWrapper tooltipTitle={props.cellTooltip}>
          <div
            tabIndex={editable ? 0 : -1 }
            onFocus={enterEditFn}
          >
            {normalView}
          </div>
        </CellWrapper>
        {/* overlay on normal view to handle double click for editing */}
        {editable && (
          <CellWrapper tooltipTitle={props.cellTooltip}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              onDoubleClick={!singleClickEdit ? enterEditFn : undefined}
              onClick={singleClickEdit ? enterEditFn : undefined}
            >
            </div>
          </CellWrapper>
        )}
      </ColumnTypeView>
  );
}
