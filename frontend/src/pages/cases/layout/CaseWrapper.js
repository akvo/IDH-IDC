import React, { useState, useRef } from "react";
import "./case-wrapper.scss";
import { useNavigate } from "react-router-dom";
import { Row, Col, Steps, Layout, Affix, Button, Space, Alert } from "antd";
import { ContentLayout } from "../../../components/layout";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { CaseSettings } from "../components";
import { stepPath, CaseUIState } from "../store";

const { Sider, Content } = Layout;

const sidebarItems = [
  {
    title: "Set an income target",
    description: "Use a living income benchmark or define the target yourself.",
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

const CaseSidebar = ({ step, caseId }) => {
  const navigate = useNavigate();

  const findStepPathValue = Object.values(stepPath).find(
    (path) => path.label === step
  )?.value;

  return (
    <Steps
      direction="vertical"
      items={sidebarItems}
      className="case-step-wrapper"
      onChange={(val) =>
        navigate(`/case/${caseId}/${stepPath[`step${val + 1}`].label}`)
      }
      current={findStepPathValue ? findStepPathValue - 1 : 1}
    />
  );
};

const CaseWrapper = ({ children, step, caseId, currentCase }) => {
  const caseButtonState = CaseUIState.useState((s) => s.caseButton);
  const [caseSettingModalVisible, setCaseSettingModalVisible] = useState(false);

  // Use refs to store the functions
  const backFunctionRef = useRef(() => {});
  const nextFunctionRef = useRef(() => {});

  const handleBack = () => {
    backFunctionRef.current();
  };

  const handleNext = () => {
    nextFunctionRef.current();
  };

  return (
    <Row id="case-detail" className="case-container">
      <Col span={24}>
        <Row>
          <Col span={5}>
            <Affix offsetTop={80}>
              <Sider className="case-sidebar-container" width="100%">
                <CaseSidebar step={step} caseId={caseId} />
              </Sider>
            </Affix>
          </Col>
          <Col span={19} className="case-content-container">
            <Content>
              <ContentLayout
                breadcrumbItems={[
                  { title: "Home", href: "/welcome" },
                  { title: "Cases", href: "/cases" },
                ]}
                title={currentCase?.name}
                titleRighContent={
                  <Button
                    className="button-green-transparent"
                    icon={<SettingOutlined />}
                    onClick={() => setCaseSettingModalVisible(true)}
                  >
                    Case settings
                  </Button>
                }
              >
                {currentCase.segments.filter((s) => s.id).length ? (
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

      {/* Next Back Button */}
      <Col span={24} align="end" className="case-button-wrapper">
        <Space>
          <Button
            disabled={caseButtonState.loading}
            onClick={handleBack}
            className="button-green"
          >
            <ArrowLeftOutlined /> Back
          </Button>
          <Button
            loading={caseButtonState.loading}
            disabled={caseButtonState.loading}
            onClick={handleNext}
            className="button-green-fill"
          >
            Next <ArrowRightOutlined />
          </Button>
        </Space>
      </Col>

      <CaseSettings
        open={caseSettingModalVisible}
        handleCancel={() => setCaseSettingModalVisible(false)}
        enableEditCase={true}
      />
    </Row>
  );
};

export default CaseWrapper;
