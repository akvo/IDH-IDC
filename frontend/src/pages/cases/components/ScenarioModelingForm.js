import React from "react";
import { Row, Col, Form, Input, Select } from "antd";
import { CaseUIState } from "../store";
import { selectProps } from "../../../lib";
import { VisualCardWrapper } from "./";

const ScenarioModelingForm = ({ currentScenarioData }) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  return (
    <Row gutter={[20, 20]} className="scenario-modeling-form-container">
      {/* Scenario Details Form */}
      <Col span={24}>
        <Form layout="vertical" name="scenario-modeling-detail-form">
          <Row align="middle" gutter={[20, 20]}>
            <Col span={6}>
              <Form.Item name="name" label="Give your scenario a name">
                <Input disabled={!enableEditCase} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description"
                label="Describe here what the scenario entails"
              >
                <Input disabled={!enableEditCase} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="approach" label="Choose approach">
                <Select
                  {...selectProps}
                  disabled={!enableEditCase}
                  options={[]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Col>
      {/* EOL Scenario Details Form */}

      {/* Scenario Income Drivers & Chart */}
      <Col span={24}>
        <Row
          align="middle"
          gutter={[20, 20]}
          className="income-driver-form-container"
        >
          <Col span={8} className="income-driver-form-section">
            <div className="title">
              You can select up to 5 variables to change
            </div>
            <div className="description">
              Make sure that you select variables you can influence/are within
              your control.
            </div>
          </Col>
          <Col span={16}>
            <VisualCardWrapper
              title="Optimal driver values to reach your target"
              bordered
            >
              Chart
            </VisualCardWrapper>
          </Col>
        </Row>
      </Col>
      {/* EOL Scenario Income Drivers & Chart */}
    </Row>
  );
};

export default ScenarioModelingForm;
