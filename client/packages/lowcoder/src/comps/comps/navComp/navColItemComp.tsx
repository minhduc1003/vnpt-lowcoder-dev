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
import { migrateOldData, withDefault } from "comps/generators/simpleGenerators";
import {
  clickEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";
const events = [clickEvent];

const childrenMap = {
  label: StringControl,
  hidden: BoolCodeControl,
  action: LayoutActionComp,
  itemKey: valueComp<string>(""),
  icon: IconControl,
  onEvent: withDefault(eventHandlerControl(events), [
    {
      // name: "click",
      name: "click",
      handler: {
        compType: "openAppPage",
      },
    },
  ]),
};

type ChildrenType = ToInstanceType<typeof childrenMap> & {
  items: InstanceType<typeof NavColItemListComp>;
  onEvent: InstanceType<ReturnType<typeof eventHandlerControl>>;
};

/**
 * copy from navItemComp,
 * FIXME: refactor it more general
 */
export class NavColItemComp extends MultiBaseComp<ChildrenType> {
  override getView() {
    return _.mapValues(this.children, (c) =>
      c.getView()
    ) as ToViewReturn<ChildrenType>;
  }

  override getPropertyView(): ReactNode {
    return (
      <>
        {this.children.action.propertyView({
          onAppChange: (label) => {
            label && this.children.label.dispatchChangeValueAction(label);
          },
        })}
        {this.children.label.propertyView({ label: trans("label") })}
        {this.children.icon.propertyView({
          label: trans("icon"),
          tooltip: trans("aggregation.iconTooltip"),
        })}
        {hiddenPropertyView(this.children)}
        {this.children.onEvent.propertyView({ inline: true })}
      </>
    );
  }

  override parseChildrenFromValue(params: any) {
    return parseChildrenFromValueAndChildrenMap(params, {
      ...childrenMap,
      items: NavColItemListComp,
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

const NavColItemCompMigrate = migrateOldData(NavColItemComp, (oldData: any) => {
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
});

export class NavColItemListComp extends list(NavColItemCompMigrate) {
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
