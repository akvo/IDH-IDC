import React from "react";
import { Row, Col, Form, Input, Select, Tooltip, Space } from "antd";
import { CaseUIState, CaseVisualState } from "../store";
import { selectProps } from "../../../lib";
import { SegmentTabsWrapper } from "../layout";
import ScenarioModelingIncomeDriversAndChart from "./ScenarioModelingIncomeDriversAndChart";
import { InfoCircleOutlined } from "@ant-design/icons";

const ScenarioModelingForm = ({ currentScenarioData }) => {
  const [scenarioDetailForm] = Form.useForm();
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const onScenarioDetailFormValuesChange = (changedValue) => {
    CaseVisualState.update((s) => ({
      ...s,
      scenarioModeling: {
        ...s.scenarioModeling,
        config: {
          ...s.scenarioModeling.config,
          scenarioData: s.scenarioModeling.config.scenarioData.map(
            (scenario) => {
              if (scenario.key === currentScenarioData.key) {
                return {
                  ...scenario,
                  ...changedValue,
                };
              }
              return scenario;
            }
          ),
        },
      },
    }));
  };

  return (
    <Row gutter={[20, 20]} className="scenario-modeling-form-container">
      <Col span={24}>
        <Form
          layout="vertical"
          name="scenario-modeling-detail-form"
          form={scenarioDetailForm}
          onValuesChange={onScenarioDetailFormValuesChange}
          initialValues={{
            name: currentScenarioData?.name || null,
            description: currentScenarioData?.description || null,
            percentage: currentScenarioData?.percentage || true,
          }}
        >
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
              <Form.Item
                name="percentage"
                label={
                  <Space>
                    <div>Choose approach</div>
                    <Tooltip
                      placement="top"
                      title="Please choose whether you would like to express the changes in current values using percentages or absolute values."
                      color="#26605f"
                    >
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
              >
                <Select
                  {...selectProps}
                  disabled={!enableEditCase}
                  options={[
                    { label: "Percentage", value: true },
                    { label: "Absolute", value: false },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Col>

      <Col span={24}>
        <SegmentTabsWrapper>
          <ScenarioModelingIncomeDriversAndChart
            currentScenarioData={currentScenarioData}
          />
        </SegmentTabsWrapper>
      </Col>
    </Row>
  );
};

export default ScenarioModelingForm;
