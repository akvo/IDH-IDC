import React, { useState } from "react";
import "./case-wrapper.scss";
import { Row, Col, Steps } from "antd";
import { ContentLayout } from "../../../components/layout";

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

const CaseSidebar = ({ stepId }) => {
  const [currentStep, setCurrentStep] = useState(stepId - 1);
  return (
    <Steps
      direction="vertical"
      items={sidebarItems}
      className="case-step-wrapper"
      onChange={(val) => setCurrentStep(val)}
      current={currentStep}
    />
  );
};

const CaseWrapper = ({ children, stepId }) => {
  return (
    <Row id="case-detail" className="case-container">
      <Col span={6} className="case-sidebar-container">
        <CaseSidebar stepId={stepId} />
      </Col>
      <Col span={18} className="case-content-container">
        <ContentLayout
          breadcrumbItems={[
            { title: "Home", href: "/welcome" },
            { title: "Cases", href: "/cases" },
          ]}
        >
          {children}
        </ContentLayout>
      </Col>
    </Row>
  );
};

export default CaseWrapper;
