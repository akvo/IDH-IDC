import React, { useState, useRef } from "react";
import "./case-wrapper.scss";
import { useNavigate } from "react-router-dom";
import { Row, Col, Steps, Layout, Affix, Button, Space } from "antd";
import { ContentLayout } from "../../../components/layout";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { CaseSettings } from "../components";
import { stepPath } from "../store";

const { Sider, Content } = Layout;

const sidebarItems = [
  {
    title:
      "Set an income target: use a living income benchmark or define the target yoruself",
    description:
      "Set an income target: define the target yourself or rely on a living income.",
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
                {React.cloneElement(children, {
                  setbackfunction: (fn) => (backFunctionRef.current = fn),
                  setnextfunction: (fn) => (nextFunctionRef.current = fn),
                })}
              </ContentLayout>
            </Content>
          </Col>
        </Row>
      </Col>

      {/* Next Back Button */}
      <Col span={24} align="end" className="case-button-wrapper">
        <Space>
          <Button onClick={handleBack} className="button-green">
            <ArrowLeftOutlined /> Back
          </Button>
          <Button onClick={handleNext} className="button-green-fill">
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
