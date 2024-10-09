import { MultiBaseComp } from "lowcoder-core";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { valueComp } from "comps/generators";
import { list } from "comps/generators/list";
import {
  parseChildrenFromValueAndChildrenMap,
  ToInstanceType,
  ToViewReturn,
} from "comps/generators/multi";
import _ from "lodash";
import { ReactNode } from "react";
import { IconControl } from "comps/controls/iconControl";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { genRandomKey } from "comps/utils/idGenerator";
import { LayoutActionComp } from "comps/comps/layout/layoutActionComp";
import { migrateOldData } from "comps/generators/simpleGenerators";

const childrenMap = {
  label: StringControl,
  itemKey: valueComp<string>(""),
};

type ChildrenType = ToInstanceType<typeof childrenMap> & {
  items: InstanceType<typeof TableColItemListComp>;
};

/**
 * copy from navItemComp,
 * FIXME: refactor it more general
 */
export class TableColItemComp extends MultiBaseComp<ChildrenType> {
  override getView() {
    return _.mapValues(this.children, (c) =>
      c.getView()
    ) as ToViewReturn<ChildrenType>;
  }

  override getPropertyView(): ReactNode {
    return <>{this.children.label.propertyView({ label: trans("label") })}</>;
  }

  override parseChildrenFromValue(params: any) {
    return parseChildrenFromValueAndChildrenMap(params, {
      ...childrenMap,
      items: TableColItemListComp,
    }) as unknown as ChildrenType;
  }

  protected override ignoreChildDefaultValue() {
    return true;
  }

  addSubItem(value: any) {
    this.children.items.addItem(value);
  }
  getItemKey() {
    return this.children.itemKey.getView();
  }
}

const TableColItemCompMigrate = migrateOldData(
  TableColItemComp,
  (oldData: any) => {
    if (oldData && oldData.hasOwnProperty("app")) {
      const migrateKeys = [
        "app",
        "queryParam",
        "hashParam",
        "hideWhenNoPermission",
      ];
      const notChangeData = _.omit(oldData, migrateKeys);
      const oldAppData = _.pick(oldData, migrateKeys);
      return {
        ...notChangeData,
        action: {
          compType: "openApp",
          comp: oldAppData,
        },
        itemKey: oldData.app?.appId || genRandomKey(),
      };
    } else {
      return oldData;
    }
  }
);

export class TableColItemListComp extends list(TableColItemCompMigrate) {
  addItem(value?: any) {
    const data = this.getView();

    this.dispatch(
      this.pushAction(
        value
          ? {
              ...value,
              itemKey: value.itemKey || genRandomKey(),
            }
          : {
              label: trans("menuItem") + " " + (data.length + 1),
              itemKey: genRandomKey(),
            }
      )
    );
  }

  deleteItem(index: number) {
    this.dispatch(this.deleteAction(index));
  }

  moveItem(from: number, to: number) {
    this.dispatch(this.arrayMoveAction(from, to));
  }
}
