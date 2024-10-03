import { RightPanelWrapper } from "pages/common/styledComponent";
import { Tabs } from "lowcoder-design";
import PropertyView from "./PropertyView";
import InsertView from "./InsertView";
import type UIComp from "comps/comps/uiComp";
import type { UiLayoutType } from "comps/comps/uiComp";
import { useEffect, useState } from "react";
import { AttributeIcon } from "lowcoder-design";
import { InsertIcon } from "lowcoder-design";
import { trans } from "i18n";
import { isAggregationApp } from "util/appUtils";
import React from "react";

type RightPanelProps = {
  onTabChange: (key: string) => void;
  onCompDrag: (dragCompKey: string) => void;
  showPropertyPane: boolean;
  uiComp?: InstanceType<typeof UIComp>;
};

function RightPanel(props: RightPanelProps) {
  const { onTabChange, showPropertyPane, uiComp } = props;
  const uiCompType = uiComp && (uiComp.children.compType.getView() as UiLayoutType);
  const aggregationApp = uiCompType && isAggregationApp(uiCompType);
  const [activeKey, setActiveKey] = useState("insert");
  const tabConfigs = [
    {
      key: "property",
      title: trans("rightPanel.propertyTab"),
      icon: <AttributeIcon />,
      content: <PropertyView uiComp={uiComp} />,
    },
  ];
  if (!aggregationApp) {
    tabConfigs.push({
      key: "insert",
      title: trans("rightPanel.createTab"),
      icon: <InsertIcon />,
      content: <InsertView onCompDrag={props.onCompDrag} />,
    });
  }
  useEffect(() => {
    const key = aggregationApp || showPropertyPane ? "property" : "insert";
    key !== activeKey && setActiveKey(key);
  }, [showPropertyPane, aggregationApp, activeKey]);

  return (
    <RightPanelWrapper className="cypress-right-content">
      <Tabs
        onChange={(key) => {
          onTabChange(key);
        }}
        tabsConfig={tabConfigs}
        activeKey={activeKey}
      />
    </RightPanelWrapper>
  );
}

export default React.memo(RightPanel);
