import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { UICompBuilder, withDefault } from "comps/generators";
import { Section, sectionNames } from "lowcoder-design";
import styled from "styled-components";
import {
  JSONObjectArrayControl,
  StringControl,
} from "comps/controls/codeControl";
import { styleControl } from "comps/controls/styleControl";
import { trans } from "i18n";

import { useEffect, useRef, useState } from "react";
import { withIsLoadingMethod } from "@lowcoder-ee/index.sdk";
import { relative } from "path";
const Wrapper = styled.div`
  border-radius: 4px;
  @media only screen and (max-width: 360px) {
    width: 15px;
    height: 15px;
  }
  @media only screen and (min-width: 360px) and (max-width: 768px) {
    width: 20px;
    height: 20px;
  }
  width: 30px;
  height: 30px;
`;
const Count = styled.div<{
  $countStyle?: any;
}>`
  position: absolute;
  right: 0;
  top: 0;
  font-size: 14px;
  color: ${(props) => props.$countStyle.color || "#fff"};
  width: 40%;
  height: 40%;
  border-radius: 100%;
  background-color: ${(props) => props.$countStyle.backgroundColor || "red"};
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Dropdown = styled.div<{
  $isOpen?: boolean;
  $hoverStyle?: any;
  $itemStyle?: any;
  $width?: string;
}>`
  @media only screen and (max-width: 360px) {
    width: 100px;
    .dropdown-head {
      padding: 2.5px 5px !important;
      font-size: 14px !important;
    }
    .dropdown-content-item {
      padding: 2.5px 5px !important;
    }
    .dropdown-content-item > .dropdown-content__icon {
      display: none;
    }
    .dropdown-content-item > .dropdown-content__content > p {
      font-size: 10px;
    }
  }
  @media only screen and (min-width: 360px) and (max-width: 768px) {
    width: 220px;
    .dropdown-head {
      padding: 5px 10px !important;
      font-size: 16px !important;
    }
    .dropdown-content-item {
      padding: 5px 10px !important;
    }
    .dropdown-content-item > .dropdown-content__icon {
      display: none;
    }
    .dropdown-content-item > .dropdown-content__content > p {
      font-size: 11px;
    }
  }
  @media only screen and (min-width: 768px) and (max-width: 1024px) {
    width: 300px;
  }
  display: ${(props) => (props.$isOpen ? "block" : "none")};
  position: absolute;
  width: 350px;
  right: 0;
  background-color: ${(props) => props.$itemStyle.backgroundColor || "#fff"};
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  border-radius: 10px;
  z-index: 1000;
  .dropdown-head {
    padding: 10px 20px;
    font-size: 20px;
    font-weight: bold;
    border-bottom: 1px solid lightgray;
  }
  .dropdown-content-item {
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    &:hover {
      background-color: ${(props) =>
        props.$hoverStyle.backgroundColor || "lightblue"};
      color: ${(props) => props.$hoverStyle.color || "black"};
    }
  }
  .dropdown-content-item > .dropdown-content__icon {
    width: 50px;
    height: 50px;
    background-color: #fff;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
    border-radius: 100%;
    flex: 0 0 50px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .dropdown-content-item > .dropdown-content__icon > svg {
    width: 70%;
    height: 70%;
  }
  .dropdown-content-item > .dropdown-content__content > p {
    text-align: justify;
  }
`;
const StyleControl = [
  {
    name: "backgroundColor",
    label: "background color",
    color: "backgroundColor",
  },
  {
    name: "color",
    label: "text color",
    color: "color",
  },
] as const;
const childrenMap = {
  data: withIsLoadingMethod(JSONObjectArrayControl),
  countStyle: styleControl(StyleControl, "countStyle"),
  notiItemStyle: styleControl(StyleControl, "notiItemStyle"),
  notiItemHoverStyle: styleControl(StyleControl, "notiItemHoverStyle"),
  widthDropdown: withDefault(StringControl, "400px"),
};

const NotifyCompBase = new UICompBuilder(childrenMap, (props) => {
  //   const data = props.items;
  const [active, setActive] = useState(false);
  function useOutsideAlerter(ref: any) {
    useEffect(() => {
      function handleClickOutside(event: any) {
        if (ref.current && !ref.current.contains(event.target)) {
          setActive(false);
        }
      }
      document.addEventListener("mouseup", handleClickOutside);
      return () => {
        document.removeEventListener("mouseup", handleClickOutside);
      };
    }, [ref]);
  }
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef);
  return (
    <Wrapper onClick={() => setActive(!active)} ref={wrapperRef}>
      <div style={{ position: "relative" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="icon-notify"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {props.data.length > 0 && (
          <Count $countStyle={props.countStyle}>
            <span>{props.data.length}</span>
          </Count>
        )}
      </div>
      <Dropdown
        $isOpen={active}
        $hoverStyle={props.notiItemHoverStyle}
        $itemStyle={props.notiItemStyle}
        $width={props.widthDropdown}
      >
        <div className="dropdown-head">Notification</div>
        {props.data.map((d: any, i) => (
          <div className="dropdown-content-item">
            <div className="dropdown-content__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
            </div>
            <div className="dropdown-content__content">
              <h2>{d.title}</h2>
              <p>{d.content}</p>
            </div>
          </div>
        ))}
      </Dropdown>
    </Wrapper>
  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={"Data"}>
          {children.data.propertyView({
            label: "Data",
            tooltip: "Data",
          })}
        </Section>
        <Section name={"Count Style"}>
          {children.countStyle.getPropertyView()}
        </Section>
        <Section name={"Dropdown"}>
          {children.widthDropdown.propertyView({
            label: "Dropdown width",
          })}
          {children.notiItemStyle.getPropertyView()}
          {children.notiItemHoverStyle.getPropertyView()}
        </Section>
      </>
    );
  })
  .build();

export const NotifyComp = withExposingConfigs(NotifyCompBase, [
  new NameConfig("data", ""),
]);
