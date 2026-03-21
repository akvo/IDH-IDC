import React, { useState } from "react";
import {
  Row,
  Col,
  Form,
  Select,
  Tooltip,
  Space,
  Button,
  Switch,
  Divider,
  Typography,
  InputNumber,
  Table,
} from "antd";
import { CaseVisualState, CurrentCaseState } from "../store";
import { selectProps, InputNumberThousandFormatter } from "../../../lib";
import {
  InfoCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  CaretDownOutlined,
  CaretUpOutlined,
  LockOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export const ROI_COMPONENT_OPTIONS = [
  { label: "Training", value: "Training" },
  { label: "Capacity building", value: "Capacity building" },
  { label: "Input provision", value: "Input provision" },
  { label: "Financing", value: "Financing" },
  { label: "Other", value: "Other" },
];

const ScenarioModelingROIForm = ({
  form,
  currentScenarioData,
  enableEditCase,
  scenarioModeling,
}) => {
  const [isRoiExpanded, setIsRoiExpanded] = useState(false);
  const { segments } = CurrentCaseState.useState((s) => s);
  const totalFarmers = segments.reduce(
    (acc, s) => acc + (s.number_of_farmers || 0),
    0
  );

  const componentsData =
    scenarioModeling.config.investment_analysis?.scenarios?.[
      currentScenarioData.key
    ]?.components || [];

  const onAddComponent = () => {
    CaseVisualState.update((s) => {
      const config = s.scenarioModeling.config;
      const invAnalysis = config.investment_analysis;
      const scenarioKey = currentScenarioData.key;
      if (!invAnalysis.scenarios[scenarioKey]) {
        invAnalysis.scenarios[scenarioKey] = {
          investment_cost: 0,
          cost_unit: "total",
          components: [],
        };
      }
      const scenarioInv = invAnalysis.scenarios[scenarioKey];
      const newComponents = [
        ...(scenarioInv.components || []),
        { name: "", cost: 0, unit: "total", key: Date.now() },
      ];
      scenarioInv.components = newComponents;

      // Recalculate total cost
      const newTotal = newComponents.reduce((acc, item) => {
        const multiplier = item.unit === "per_farmer" ? totalFarmers : 1;
        return acc + (item.cost || 0) * multiplier;
      }, 0);
      scenarioInv.investment_cost = newTotal;
      scenarioInv.cost_unit = "total"; // Force total when components exist

      // Update form
      form?.setFieldsValue({
        investment_cost: newTotal,
        cost_unit: "total",
      });
    });
  };

  const onComponentChange = (index, field, value) => {
    CaseVisualState.update((s) => {
      const config = s.scenarioModeling.config;
      const invAnalysis = config.investment_analysis;
      const scenarioKey = currentScenarioData.key;
      const scenarioInv = invAnalysis.scenarios[scenarioKey];

      const newComponents = scenarioInv.components.map((c, i) => {
        if (i === index) {
          return { ...c, [field]: value };
        }
        return c;
      });

      scenarioInv.components = newComponents;

      // Recalculate total cost
      const newTotal = newComponents.reduce((acc, item) => {
        const multiplier = item.unit === "per_farmer" ? totalFarmers : 1;
        return acc + (item.cost || 0) * multiplier;
      }, 0);
      scenarioInv.investment_cost = newTotal;
      scenarioInv.cost_unit = "total"; // Force total when components exist

      // Update form
      form?.setFieldsValue({
        investment_cost: newTotal,
        cost_unit: "total",
      });
    });
  };

  const onDeleteComponent = (index) => {
    CaseVisualState.update((s) => {
      const config = s.scenarioModeling.config;
      const invAnalysis = config.investment_analysis;
      const scenarioKey = currentScenarioData.key;
      const scenarioInv = invAnalysis.scenarios[scenarioKey];

      const newComponents = scenarioInv.components.filter(
        (_, i) => i !== index
      );

      scenarioInv.components = newComponents;

      // Recalculate total cost
      const newTotal = newComponents.reduce((acc, item) => {
        const multiplier = item.unit === "per_farmer" ? totalFarmers : 1;
        return acc + (item.cost || 0) * multiplier;
      }, 0);
      scenarioInv.investment_cost = newTotal;

      // Force total unit if components exist, otherwise allow reset
      if (newComponents.length > 0) {
        scenarioInv.cost_unit = "total";
      }

      // Update form
      form?.setFieldsValue({
        investment_cost: newTotal,
        ...(newComponents.length > 0 ? { cost_unit: "total" } : {}),
      });
    });
  };

  return (
    <>
      <Row
        align="middle"
        justify="space-between"
        style={{
          padding: "20px 0",
          borderTop: "1px solid #f0f0f0",
          marginTop: "20px",
        }}
      >
        <Col flex="auto">
          <Text strong>
            Toggle if you have an estimate of the cost required to implement the
            scenarios.
          </Text>
        </Col>
        <Col>
          <Form.Item
            name="is_roi_enabled"
            valuePropName="checked"
            noStyle
            className="roi-toggle-item"
          >
            <Switch
              disabled={!enableEditCase}
              checkedChildren="On"
              unCheckedChildren="Off"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.is_roi_enabled !== currentValues.is_roi_enabled
        }
      >
        {({ getFieldValue }) =>
          getFieldValue("is_roi_enabled") ? (
            <div
              className="card-lib-wrapper"
              style={{
                padding: "16px",
                marginTop: "10px",
                background: "#fff",
                border: "1px solid #e1e0e0",
                borderRadius: "8px",
              }}
            >
              <Row align="middle" gutter={16}>
                <Col
                  onClick={() => setIsRoiExpanded(!isRoiExpanded)}
                  style={{
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#26605f",
                  }}
                >
                  {isRoiExpanded ? <CaretUpOutlined /> : <CaretDownOutlined />}
                </Col>
                <Col>
                  <Text strong style={{ color: "#26605f" }}>
                    Total Cost:
                  </Text>
                </Col>
                <Col>
                  <Tooltip title="Estimate the total cost to implement the changes in this scenario.">
                    <InfoCircleOutlined style={{ color: "#bfbfbf" }} />
                  </Tooltip>
                </Col>
                <Col flex="auto" />
                <Col span={7}>
                  <Form.Item name="cost_unit" noStyle>
                    <Select
                      {...selectProps}
                      disabled={!enableEditCase || componentsData.length > 0}
                      options={[
                        { label: "Total Cost", value: "total" },
                        { label: "Per farmer", value: "per_farmer" },
                        {
                          label: "Per land unit",
                          value: "per_land_unit",
                        },
                      ]}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item name="investment_cost" noStyle>
                    <InputNumber
                      disabled={!enableEditCase || componentsData.length > 0}
                      style={{ width: "100%", borderRadius: "4px" }}
                      placeholder="0"
                      min={0}
                      {...InputNumberThousandFormatter}
                      suffix={
                        componentsData.length > 0 ? <LockOutlined /> : null
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {isRoiExpanded && (
                <div style={{ marginTop: "24px" }}>
                  <Table
                    dataSource={componentsData}
                    pagination={false}
                    size="small"
                    rowKey={(record, index) => index}
                    columns={[
                      {
                        title: "Scenario component",
                        dataIndex: "name",
                        width: 300,
                        render: (text, record, index) => (
                          <Select
                            {...selectProps}
                            showSearch
                            disabled={!enableEditCase}
                            value={text}
                            placeholder="Select"
                            onChange={(value) =>
                              onComponentChange(index, "name", value)
                            }
                            options={ROI_COMPONENT_OPTIONS}
                            style={{ width: "100%", borderRadius: "4px" }}
                          />
                        ),
                      },
                      {
                        title: "Cost type",
                        dataIndex: "unit",
                        width: 250,
                        render: (text, record, index) => (
                          <Select
                            {...selectProps}
                            disabled={!enableEditCase}
                            value={text}
                            options={[
                              { label: "Total Cost", value: "total" },
                              {
                                label: "Per farmer",
                                value: "per_farmer",
                              },
                              {
                                label: "Per land unit",
                                value: "per_land_unit",
                              },
                            ]}
                            onChange={(value) =>
                              onComponentChange(index, "unit", value)
                            }
                            style={{ width: "100%" }}
                          />
                        ),
                      },
                      {
                        title: "Cost",
                        dataIndex: "cost",
                        width: 180,
                        render: (text, record, index) => (
                          <Space direction="vertical" size={2}>
                            <InputNumber
                              {...InputNumberThousandFormatter}
                              disabled={!enableEditCase}
                              value={text}
                              style={{ width: "100%", borderRadius: "4px" }}
                              placeholder="0"
                              min={0}
                              onChange={(value) =>
                                onComponentChange(index, "cost", value)
                              }
                            />
                            {record.unit !== "total" && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "rgba(0,0,0,0.45)",
                                  paddingLeft: "4px",
                                }}
                              >
                                {record.unit === "per_farmer"
                                  ? `x ${InputNumberThousandFormatter.formatter(
                                      totalFarmers
                                    )} Farmers`
                                  : record.unit === "per_land_unit"
                                  ? `x Land Area`
                                  : ""}
                              </div>
                            )}
                          </Space>
                        ),
                      },
                      {
                        title: "Total",
                        key: "total_cost",
                        align: "right",
                        render: (_, record) => {
                          const multiplier =
                            record.unit === "per_farmer" ? totalFarmers : 1;
                          const total = (record.cost || 0) * multiplier;
                          return (
                            <InputNumber
                              disabled
                              value={total}
                              style={{ width: "100%", borderRadius: "4px" }}
                              {...InputNumberThousandFormatter}
                              controls={false}
                            />
                          );
                        },
                      },
                      {
                        title: "",
                        key: "action",
                        width: 50,
                        align: "center",
                        render: (_, __, index) => (
                          <Button
                            type="text"
                            danger
                            disabled={!enableEditCase}
                            icon={<DeleteOutlined />}
                            onClick={() => onDeleteComponent(index)}
                          />
                        ),
                      },
                    ]}
                  />
                  <Button
                    type="dashed"
                    onClick={onAddComponent}
                    disabled={!enableEditCase}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: "10px" }}
                  >
                    Add component
                  </Button>
                </div>
              )}
            </div>
          ) : null
        }
      </Form.Item>
    </>
  );
};

export default ScenarioModelingROIForm;
