import React, { useState, useRef, useMemo } from "react";
import "./case-wrapper.scss";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Steps,
  Layout,
  Affix,
  Button,
  Space,
  Alert,
  Spin,
} from "antd";
import { ContentLayout } from "../../../components/layout";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  MenuOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { CaseSettings } from "../components";
import { stepPath, CaseUIState } from "../store";

const { Sider, Content } = Layout;
const buttonPrevNextPosition = "top";

const CaseSidebar = ({ step, caseId, siderCollapsed }) => {
  const navigate = useNavigate();

  const sidebarItems = useMemo(() => {
    if (siderCollapsed) {
      return [
        { title: "Step 1" },
        { title: "Step 2" },
        { title: "Step 3" },
        { title: "Step 4" },
        { title: "Step 5" },
      ];
    }
    return [
      {
        title: "Set an income target",
        description:
          "Use a living income benchmark or define the target yourself.",
      },
      {
        title: "Enter your income data",
        description:
          "Enter current and feasible data for the five income drivers and its subcomponents for each segment",
      },
      {
        title: "Understand the income gap",
        description:
          "Explore the current income situation and the gap to reach your income target.",
      },
      {
        title: "Assess impact of mitigation strategies",
        description:
          "Analyze which drivers impact income increase the most, and how to close the gap.",
      },
      {
        title: "Closing the gap",
        description:
          "Save different scenarios to close the gap, and explore procurement practices.",
      },
    ];
  }, [siderCollapsed]);

  const findStepPathValue = Object.values(stepPath).find(
    (path) => path.label === step
  )?.value;

  return (
    <div className="case-step-container">
      <Steps
        direction="vertical"
        items={sidebarItems}
        className="case-step-wrapper"
        onChange={(val) =>
          navigate(`/case/${caseId}/${stepPath[`step${val + 1}`].label}`)
        }
        current={findStepPathValue ? findStepPathValue - 1 : 1}
        size="small"
      />
    </div>
  );
};

const CaseWrapper = ({ children, step, caseId, currentCase, loading }) => {
  const caseButtonState = CaseUIState.useState((s) => s.caseButton);
  const [caseSettingModalVisible, setCaseSettingModalVisible] = useState(false);

  const [siderCollapsed, setSiderCollapsed] = useState(false);

  const layoutSize = useMemo(() => {
    if (!siderCollapsed) {
      return { left: 4, right: 20 };
    }
    return { left: 2, right: 22 };
  }, [siderCollapsed]);

  // Use refs to store the functions
  const backFunctionRef = useRef(() => {});
  const nextFunctionRef = useRef(() => {});

  const handleBack = () => {
    backFunctionRef.current();
  };

  const handleNext = () => {
    nextFunctionRef.current();
  };

  const isInLastStep = window.location.pathname.includes(stepPath.step5.label);

  const ButtonPrevNext = () => (
    <Space>
      <Button
        disabled={caseButtonState.loading}
        onClick={handleBack}
        className="button-green-transparent"
      >
        <ArrowLeftOutlined /> Back
      </Button>
      <Button
        loading={caseButtonState.loading}
        disabled={caseButtonState.loading}
        onClick={handleNext}
        className="button-green-fill"
      >
        {isInLastStep ? (
          "Save"
        ) : (
          <>
            Next <ArrowRightOutlined />
          </>
        )}
      </Button>
    </Space>
  );

  return (
    <Row id="case-detail" className="case-container">
      <Col span={24}>
        <Row>
          <Col span={layoutSize.left}>
            <Affix offsetTop={80}>
              <Sider
                className="case-sidebar-container"
                width="100%"
                collapsedWidth={100}
                collapsible={true}
                reverseArrow={true}
                trigger={null}
                collapsed={siderCollapsed}
              >
                <Button
                  icon={
                    siderCollapsed ? <MenuOutlined /> : <ArrowLeftOutlined />
                  }
                  onClick={() => setSiderCollapsed((prev) => !prev)}
                  size="large"
                  className="sider-collapsed-button"
                />
                <CaseSidebar
                  step={step}
                  caseId={caseId}
                  siderCollapsed={siderCollapsed}
                />
              </Sider>
            </Affix>
          </Col>
          <Col span={layoutSize.right} className="case-content-container">
            <Content>
              <ContentLayout
                // enable sider collapsed
                // siderCollapsedButton={true}
                // setSiderCollapsed={setSiderCollapsed}
                // siderCollapsed={siderCollapsed}
                // EOL enable sider collapsed
                breadcrumbItems={[
                  { title: "Home", href: "/welcome" },
                  { title: "Cases", href: "/cases" },
                  { title: currentCase?.name, href: "" },
                ]}
                breadcrumbRightContent={
                  <Space>
                    <Button
                      className="button-green-transparent"
                      icon={<SettingOutlined />}
                      onClick={() => setCaseSettingModalVisible(true)}
                    >
                      Case settings
                    </Button>
                    {buttonPrevNextPosition === "top" && <ButtonPrevNext />}
                  </Space>
                }
              >
                {loading ? (
                  <div className="loading-container">
                    <Spin />
                  </div>
                ) : currentCase.segments.filter((s) => s.id).length ? (
                  React.isValidElement(children) ? (
                    React.cloneElement(children, {
                      setbackfunction: (fn) => (backFunctionRef.current = fn),
                      setnextfunction: (fn) => (nextFunctionRef.current = fn),
                    })
                  ) : null
                ) : (
                  // Show alert if current case doesn't have any segments
                  <Alert
                    message="Unable to load the page. Please add segments in the Case settings first."
                    type="warning"
                  />
                )}
              </ContentLayout>
            </Content>
          </Col>
        </Row>
      </Col>

      {/* Next Back Button Bottom */}
      {buttonPrevNextPosition === "bottom" && (
        <Col span={24} align="end" className="case-button-wrapper">
          <ButtonPrevNext />
        </Col>
      )}

      <CaseSettings
        open={caseSettingModalVisible}
        handleCancel={() => setCaseSettingModalVisible(false)}
        enableEditCase={true}
      />
    </Row>
  );
};

export default CaseWrapper;
