import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Form,
  Input,
  Select,
  Tooltip,
  Space,
  Button,
  Popconfirm,
} from "antd";
import { CaseUIState, CaseVisualState } from "../store";
import { selectProps } from "../../../lib";
import { SegmentTabsWrapper } from "../layout";
import ScenarioModelingIncomeDriversAndChart from "./ScenarioModelingIncomeDriversAndChart";
import { InfoCircleOutlined, DeleteOutlined } from "@ant-design/icons";

const ScenarioModelingForm = ({
  currentScenarioData,
  showDeleteButton,
  setActiveScenario,
  deleteButtonPosition,
}) => {
  const [scenarioDetailForm] = Form.useForm();
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const scenarioModeling = CaseVisualState.useState((s) => s.scenarioModeling);

  const [deleting, setDeleting] = useState(false);
  const [current, setCurrent] = useState(currentScenarioData);

  useEffect(() => {
    const { name, description, percentage } = currentScenarioData;
    scenarioDetailForm.setFieldsValue({
      name,
      description,
      percentage,
    });
    setCurrent(currentScenarioData);
  }, [currentScenarioData, scenarioDetailForm]);

  const onDeleteScenario = () => {
    setDeleting(true);
    const remainScenarios = scenarioModeling.config.scenarioData.filter(
      (sd) => sd.key !== currentScenarioData.key
    );
    CaseVisualState.update((s) => ({
      ...s,
      scenarioModeling: {
        ...s.scenarioModeling,
        config: {
          ...s.scenarioModeling.config,
          scenarioData: remainScenarios,
        },
      },
    }));
    setActiveScenario(remainScenarios[0]?.key);
    setCurrent(remainScenarios[0]);
    setDeleting(false);
  };

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
      <Col span={24} align="end" style={{ textAlign: "right" }}>
        {showDeleteButton && deleteButtonPosition !== "tab-item" ? (
          <Popconfirm
            title="Delete"
            description="Are you sure want to delete current scenario?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => onDeleteScenario()}
            okButtonProps={{
              loading: deleting,
              disabled: deleting,
            }}
          >
            <Button size="small" className="button-delete-scenario">
              <DeleteOutlined /> Delete
            </Button>
          </Popconfirm>
        ) : (
          ""
        )}
      </Col>
      <Col span={24}>
        <Form
          layout="vertical"
          name="scenario-modeling-detail-form"
          form={scenarioDetailForm}
          onValuesChange={onScenarioDetailFormValuesChange}
          initialValues={{
            name: current?.name || null,
            description: current?.description || null,
            percentage: current?.percentage || true,
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
                      <span>
                        <InfoCircleOutlined />
                      </span>
                    </Tooltip>
                  </Space>
                }
              >
                <Select
                  {...selectProps}
                  disabled={!enableEditCase}
                  options={[
                    { label: "Change in percentage value", value: true },
                    { label: "Change in absolute value", value: false },
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
            currentScenarioData={current}
          />
        </SegmentTabsWrapper>
      </Col>
    </Row>
  );
};

export default ScenarioModelingForm;
