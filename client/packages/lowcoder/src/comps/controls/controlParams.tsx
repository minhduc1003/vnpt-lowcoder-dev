import type { CodeEditorControlParams } from "base/codeEditor/codeEditorTypes";
import { Comp } from "lowcoder-core";
import { CSSProperties, ReactNode } from "react";

export type ControlLayout = "horizontal" | "vertical"; // set propertyView's layout, default horizontal;
export type ControlPlacement = "bottom" | "right" | "modal"; // set propertyView's position, default right;

export interface ControlParams extends CodeEditorControlParams {
  key?: string;
  label?: ReactNode;
  tooltip?: ReactNode;
  width?: string;
  layout?: ControlLayout;
  labelEllipsis?: boolean;
  placement?: ControlPlacement;
  lastNode?: ReactNode;
  preInputNode?: ReactNode;
  childrenWrapperStyle?: CSSProperties;
  extraChildren?: ReactNode;
  IconType?: "OnlyAntd" | "All" | "default" | undefined;
}

export interface ControlType {
  new (params: any): Comp<any> & {
    propertyView(props: ControlParams): ReactNode;
  };
}
