import React, { useState, useMemo } from "react";
import {
  Row,
  Col,
  Form,
  Select,
  Tooltip,
  Space,
  Button,
  Radio,
  Typography,
  InputNumber,
  Table,
} from "antd";
import { CaseVisualState } from "../store";
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

export const COST_ALLOCATION_OPTIONS = [
  { label: "No", value: "no" },
  { label: "Yes, for all farmers", value: "all_farmers" },
  { label: "Yes, per segment", value: "per_segment" },
];

const ScenarioModelingROIForm = ({
  form,
  currentScenarioData,
  enableEditCase,
  scenarioModeling,
  segment, // Injected by SegmentTabsWrapper
}) => {
  const scenarioKey = currentScenarioData.key;
  const scenarioInv =
    scenarioModeling.config.investment_analysis?.scenarios?.[scenarioKey] || {};

  const costAllocationMode = useMemo(() => {
    if (scenarioInv.cost_allocation_mode) {
      return scenarioInv.cost_allocation_mode;
    }
    return scenarioInv.is_roi_enabled ? "per_segment" : "no";
  }, [scenarioInv.cost_allocation_mode, scenarioInv.is_roi_enabled]);

  const [isRoiExpanded, setIsRoiExpanded] = useState(false);
  const segmentId = segment?.id;
  const farmers = segment?.number_of_farmers || 0;

  const componentsData = useMemo(() => {
    if (costAllocationMode === "all_farmers") {
      return scenarioInv.all_farmers_config?.components || [];
    }
    return scenarioInv.segments?.[segmentId]?.components || [];
  }, [
    costAllocationMode,
    scenarioInv.all_farmers_config,
    scenarioInv.segments,
    segmentId,
  ]);

  const selectedNames = useMemo(
    () => componentsData.map((c) => c.name).filter(Boolean),
    [componentsData]
  );

  const onAddComponent = () => {
    CaseVisualState.update((s) => {
      const config = s.scenarioModeling.config;
      const invAnalysis = config.investment_analysis;
      if (!invAnalysis.scenarios[scenarioKey]) {
        invAnalysis.scenarios[scenarioKey] = {
          is_roi_enabled: true,
          cost_allocation_mode: costAllocationMode,
          segments: {},
        };
      }
      const sInv = invAnalysis.scenarios[scenarioKey];

      let target;
      if (costAllocationMode === "all_farmers") {
        if (!sInv.all_farmers_config) {
          sInv.all_farmers_config = {
            investment_cost: 0,
            cost_unit: "total",
            components: [],
          };
        }
        target = sInv.all_farmers_config;
      } else {
        if (!sInv.segments) {
          sInv.segments = {};
        }
        if (!sInv.segments[segmentId]) {
          sInv.segments[segmentId] = { investment_cost: 0, components: [] };
        }
        target = sInv.segments[segmentId];
      }

      const newComponents = [
        ...(target.components || []),
        { name: "", cost: 0, unit: "total", key: Date.now() },
      ];
      target.components = newComponents;

      // Recalculate component total
      const total = newComponents.reduce((acc, item) => {
        let multiplier = 1;
        if (item.unit === "per_farmer") {
          multiplier = farmers;
        } else if (item.unit === "per_land_unit") {
          multiplier = farmers * (segment?.land_size || 0);
        }
        return acc + (item.cost || 0) * multiplier;
      }, 0);
      target.investment_cost = total;
      target.cost_unit = "total";

      // Sync form
      form?.setFieldsValue({
        investment_cost: total,
        cost_unit: "total",
      });
    });
  };

  const onComponentChange = (index, field, value) => {
    CaseVisualState.update((s) => {
      const sInv =
        s.scenarioModeling.config.investment_analysis.scenarios[scenarioKey];
      const target =
        costAllocationMode === "all_farmers"
          ? sInv.all_farmers_config
          : sInv.segments[segmentId];

      const newComponents = target.components.map((c, i) => {
        if (i === index) {
          return { ...c, [field]: value };
        }
        return c;
      });

      target.components = newComponents;

      const total = newComponents.reduce((acc, item) => {
        let multiplier = 1;
        if (item.unit === "per_farmer") {
          multiplier = farmers;
        } else if (item.unit === "per_land_unit") {
          multiplier = farmers * (segment?.land_size || 0);
        }
        return acc + (item.cost || 0) * multiplier;
      }, 0);
      target.investment_cost = total;
      target.cost_unit = "total";

      form?.setFieldsValue({ investment_cost: total });
    });
  };

  const onDeleteComponent = (index) => {
    CaseVisualState.update((s) => {
      const sInv =
        s.scenarioModeling.config.investment_analysis.scenarios[scenarioKey];
      const target =
        costAllocationMode === "all_farmers"
          ? sInv.all_farmers_config
          : sInv.segments[segmentId];

      const newComponents = target.components.filter((_, i) => i !== index);
      target.components = newComponents;

      const total = newComponents.reduce((acc, item) => {
        let multiplier = 1;
        if (item.unit === "per_farmer") {
          multiplier = farmers;
        } else if (item.unit === "per_land_unit") {
          multiplier = farmers * (segment?.land_size || 0);
        }
        return acc + (item.cost || 0) * multiplier;
      }, 0);
      target.investment_cost = total;
      target.cost_unit = "total";

      form?.setFieldsValue({ investment_cost: total });
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
            Do you have an estimate of the cost required to implement the
            scenarios?
          </Text>
        </Col>
        <Col>
          <Form.Item name="cost_allocation_mode" noStyle>
            <Radio.Group
              disabled={!enableEditCase}
              optionType="button"
              buttonStyle="solid"
              options={COST_ALLOCATION_OPTIONS}
              onChange={(e) => {
                const mode = e.target.value;
                CaseVisualState.update((s) => {
                  const sInv =
                    s.scenarioModeling.config.investment_analysis.scenarios[
                      scenarioKey
                    ];
                  sInv.cost_allocation_mode = mode;
                  sInv.is_roi_enabled = mode !== "no";

                  // Reset form is_roi_enabled for shouldUpdate listeners
                  form?.setFieldsValue({ is_roi_enabled: mode !== "no" });
                });
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.cost_allocation_mode !== currentValues.cost_allocation_mode
        }
      >
        {({ getFieldValue }) =>
          getFieldValue("cost_allocation_mode") !== "no" &&
          // Fallback for cases where mode is not yet set but is_roi_enabled is true
          (getFieldValue("cost_allocation_mode") !== undefined ||
            getFieldValue("is_roi_enabled")) ? (
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
                        onCell: () => ({ style: { verticalAlign: "top" } }),
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
                            options={ROI_COMPONENT_OPTIONS.map((opt) => ({
                              ...opt,
                              disabled:
                                selectedNames.includes(opt.value) &&
                                opt.value !== text,
                            }))}
                            style={{ width: "100%", borderRadius: "4px" }}
                          />
                        ),
                      },
                      {
                        title: "Cost type",
                        dataIndex: "unit",
                        width: 250,
                        onCell: () => ({ style: { verticalAlign: "top" } }),
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
                        onCell: () => ({ style: { verticalAlign: "top" } }),
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
                                      farmers
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
                        onCell: () => ({ style: { verticalAlign: "top" } }),
                        render: (_, record) => {
                          const multiplier =
                            record.unit === "per_farmer" ? farmers : 1;
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
                        onCell: () => ({ style: { verticalAlign: "top" } }),
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
