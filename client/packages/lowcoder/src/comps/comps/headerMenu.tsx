import { withExposingConfigs } from "comps/generators/withExposing";
import { UICompBuilder } from "comps/generators";
import { Section } from "lowcoder-design";
import styled from "styled-components";

import { HeaderMenuOptionControl, styleControl } from "@lowcoder-ee/index.sdk";
import { useEffect, useRef, useState } from "react";

const dropdownStyleOption = [
  {
    name: "backgroundColor",
    label: "background",
    backgroundColor: "backgroundColor",
    lineHeight: "1.5",
  },
];
const dropdownItemStyleOption = [
  {
    name: "backgroundColor",
    label: "background",
    backgroundColor: "backgroundColor",
    lineHeight: "1.5",
  },
  {
    name: "color",
    label: "text",
    color: "color",
  },
];
const childrenMap = {
  options: HeaderMenuOptionControl,
  dropdownStyle: styleControl(dropdownStyleOption, "dropdownStyle"),
  dropdownItemHoverStyle: styleControl(
    dropdownItemStyleOption,
    "dropdownItemHoverStyle"
  ),
};
const DropDown = styled.div<{
  $active: boolean;
  $style: any;
}>`
  padding: 10px 20px;
  position: absolute;
  right: 0;
  top: 50px;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  gap: 20px;
  z-index: 100;
  box-shadow:
    rgba(0, 0, 0, 0.25) 0px 54px 55px,
    rgba(0, 0, 0, 0.12) 0px -12px 30px,
    rgba(0, 0, 0, 0.12) 0px 4px 6px,
    rgba(0, 0, 0, 0.17) 0px 12px 13px,
    rgba(0, 0, 0, 0.09) 0px -3px 5px;
  display: ${(props) => (props.$active ? "flex" : "none")};
  background-color: ${(props) => props.$style?.backgroundColor || "white"};
`;
const MenuItem = styled.div<{
  $styleHover: any;
}>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  &:hover {
    background-color: ${(props) => props.$styleHover?.backgroundColor};
    color: ${(props) => props.$styleHover?.color};
  }
`;
const HeaderMenuCompBase = new UICompBuilder(childrenMap, (props) => {
  const [menuActive, setMenuActive] = useState(false);
  function useOutsideAlerter(ref: any) {
    useEffect(() => {
      function handleClickOutside(event: any) {
        if (ref.current && !ref.current.contains(event.target)) {
          setMenuActive(false);
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
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        onClick={() => setMenuActive(!menuActive)}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </svg>
      <DropDown
        $active={menuActive}
        $style={props.dropdownStyle}
        ref={wrapperRef}
      >
        {props.options?.map((item: any) => (
          <MenuItem
            $styleHover={props.dropdownItemHoverStyle}
            key={item?.label}
            onClick={() => item.onEvent("click")}
          >
            {item?.icon != "" && (
              <img
                src={item?.icon}
                alt=""
                style={{ width: "50px", height: "50px", borderRadius: "100%" }}
              />
            )}
            <p
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item?.label}
            </p>
          </MenuItem>
        ))}
      </DropDown>
    </>
  );
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={"data"}>{children.options.propertyView({})}</Section>
        <Section name={"dropdownStyle"}>
          {children.dropdownStyle.getPropertyView()}
        </Section>
        <Section name={"dropdownItemHoverStyle"}>
          {children.dropdownItemHoverStyle.getPropertyView()}
        </Section>
      </>
    );
  })
  .build();

export const HeaderMenuComp = withExposingConfigs(HeaderMenuCompBase, []);
