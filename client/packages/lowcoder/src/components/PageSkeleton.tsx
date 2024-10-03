import { default as Layout } from "antd/es/layout";
import { default as Skeleton } from "antd/es/skeleton";
import MainContent from "components/layout/MainContent";
import SideBar from "components/layout/SideBar";
import Header from "./layout/Header";
import { Logo, LogoWithName, LogoHome } from "@lowcoder-ee/assets/images";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getBrandingConfig, getSystemConfigFetching } from "../redux/selectors/configSelectors";
import { isFetchUserFinished } from "../redux/selectors/usersSelectors";
import { CSSProperties } from "react";

interface IProps {
  logoWithName?: boolean;
  hideHeader?: boolean;
  headStyle?: CSSProperties;
  hideSideBar?: boolean;
  hideContent?: boolean;
}

const StyledLogo = styled(Logo)`
  height: 24px;
  width: 24px;
`;

const StyledLogoHome = styled(LogoHome)`
  height: 24px;
  width: 24px;
`;

const StyledLogoWithName = styled(LogoWithName)`
  height: 28px;
  /* width: 28px; */
`;

const StyledSkeleton = styled(Skeleton)`
  display: flex;
  padding: 16px 0;
  justify-content: center;
  align-items: center;

  .ant-skeleton-content {
    display: block;
    max-width: 960px;
  }
`;

const SkeletonWrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 40px;

  div {
    width: 100%;
  }
`;

export default function PageSkeleton(props: IProps) {
  const isConfigFetching = useSelector(getSystemConfigFetching);
  const fetchUserFinished = useSelector(isFetchUserFinished);
  const brandingConfig = useSelector(getBrandingConfig);

  const isHeaderReady = !isConfigFetching && fetchUserFinished;

  const {
    logoWithName = false,
    hideHeader = false,
    hideSideBar = false,
    hideContent = false,
  } = props;
  const skeleton = (
    <SkeletonWrapper>
      <div>
        <StyledSkeleton active />
        <StyledSkeleton active />
      </div>
    </SkeletonWrapper>
  );

  // {/* headerStart={REACT_APP_LOWCODER_SHOW_BRAND === 'true' ? REACT_APP_LOWCODER_CUSTOM_LOGO !== "" ? <img src={REACT_APP_LOWCODER_CUSTOM_LOGO} alt="logo" /> :<StyledLogoWithName branding={true} /> : <StyledLogoHome branding={true} />} */}

  return (
    <Layout>
      {/* {!hideHeader && isHeaderReady && (
        <Header 
          headerStart={<StyledLogoWithName branding={true} />}
          style={{ backgroundColor: brandingConfig?.headerColor, ...props.headStyle }}
        />
      )} */}
      <Layout>
        {!hideSideBar && <SideBar>{skeleton}</SideBar>}
        <MainContent>{!hideContent && skeleton}</MainContent>
      </Layout>
    </Layout>
    
  );
}
