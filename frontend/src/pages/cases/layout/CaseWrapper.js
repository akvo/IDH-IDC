import React, { useState } from "react";
import "./case-wrapper.scss";
import { useNavigate } from "react-router-dom";
import { Row, Col, Steps, Layout, Affix, Button } from "antd";
import { ContentLayout } from "../../../components/layout";
import { SettingOutlined } from "@ant-design/icons";
import { CaseSettings } from "../components";

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

const CaseSidebar = ({ stepId, caseId }) => {
  const navigate = useNavigate();

  return (
    <Steps
      direction="vertical"
      items={sidebarItems}
      className="case-step-wrapper"
      onChange={(val) => navigate(`/case/${caseId}/${val + 1}`)}
      current={stepId - 1}
    />
  );
};

const CaseWrapper = ({ children, stepId, caseId, currentCase }) => {
  const [caseSettingModalVisible, setCaseSettingModalVisible] = useState(false);

  return (
    <Row id="case-detail" className="case-container">
      <Col span={4}>
        <Affix offsetTop={80}>
          <Sider className="case-sidebar-container" width="100%">
            <CaseSidebar stepId={stepId} caseId={caseId} />
          </Sider>
        </Affix>
      </Col>
      <Col span={20} className="case-content-container">
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
            {children}
          </ContentLayout>
        </Content>
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
