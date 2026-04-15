import React, { useMemo, useEffect } from "react";
import { orderBy } from "lodash";
import { getLandArea } from "../utils/roiCalculations";
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
  Input,
  Table,
} from "antd";
import { CurrentCaseState, CaseVisualState, CaseUIState } from "../store";
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
  const currentCase = CurrentCaseState.useState((s) => s);
  const { activeSegmentId, isRoiExpandedAll, isRoiExpandedSegments } =
    CaseUIState.useState((s) => s.general);
  const scenarioKey = currentScenarioData.key;
  const scenarioInv =
    scenarioModeling.config.investment_analysis?.scenarios?.[scenarioKey] || {};

  const costAllocationMode = useMemo(() => {
    if (scenarioInv.cost_allocation_mode) {
      return scenarioInv.cost_allocation_mode;
    }
    return scenarioInv.is_roi_enabled ? "per_segment" : "no";
  }, [scenarioInv.cost_allocation_mode, scenarioInv.is_roi_enabled]);

  const segmentId = segment?.id;

  const isRoiExpanded = useMemo(() => {
    if (costAllocationMode === "all_farmers") {
      return isRoiExpandedAll !== false;
    }
    if (costAllocationMode === "per_segment") {
      return isRoiExpandedSegments[segmentId] !== false;
    }
    return false;
  }, [costAllocationMode, isRoiExpandedAll, isRoiExpandedSegments, segmentId]);
  const totalFarmers = useMemo(
    () =>
      (currentCase.segments || []).reduce(
        (acc, s) => acc + (s.number_of_farmers || 0),
        0
      ),
    [currentCase.segments]
  );

  const displayFarmers = useMemo(() => {
    if (costAllocationMode === "all_farmers") {
      return totalFarmers;
    }
    return segment?.number_of_farmers || 0;
  }, [costAllocationMode, totalFarmers, segment?.number_of_farmers]);

  const totalLandArea = useMemo(() => {
    return (currentCase.segments || []).reduce(
      (acc, s) => acc + (s.number_of_farmers || 0) * getLandArea(s),
      0
    );
  }, [currentCase.segments]);

  const displayLandMultiplier = useMemo(() => {
    if (costAllocationMode === "all_farmers") {
      // In "All Farmers" mode, the form configures the collective investment
      // for the entire case. Therefore, the multiplier must be the total area.
      return totalLandArea;
    }
    // In "Per Segment" mode, the form configures only the active segment's investment.
    return (segment?.number_of_farmers || 0) * getLandArea(segment);
  }, [costAllocationMode, totalLandArea, segment]);

  useEffect(() => {
    if (
      costAllocationMode === "all_farmers" &&
      scenarioInv.all_farmers_config
    ) {
      form?.setFieldsValue({
        investment_cost: scenarioInv.all_farmers_config.investment_cost,
        cost_unit: scenarioInv.all_farmers_config.cost_unit || "total",
      });
    } else if (costAllocationMode === "per_segment" && segmentId) {
      const segConfig = scenarioInv.segments?.[segmentId];
      form?.setFieldsValue({
        investment_cost: segConfig?.investment_cost || 0,
        cost_unit: segConfig?.cost_unit || "total",
      });
    }
  }, [
    costAllocationMode,
    segmentId,
    scenarioInv.all_farmers_config,
    scenarioInv.segments,
    form,
  ]);

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
    () =>
      componentsData
        .map((c) => c.name)
        .filter((name) => name && name !== "Other"),
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
        { name: "", otherName: "", cost: 0, unit: "total", key: Date.now() },
      ];
      target.components = newComponents;

      // Recalculate component total
      const total = newComponents.reduce((acc, item) => {
        let multiplier = 1;
        if (item.unit === "per_farmer") {
          multiplier = displayFarmers;
        } else if (item.unit === "per_land_unit") {
          multiplier = displayLandMultiplier;
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
          multiplier = displayFarmers;
        } else if (item.unit === "per_land_unit") {
          multiplier = displayLandMultiplier;
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
          multiplier = displayFarmers;
        } else if (item.unit === "per_land_unit") {
          multiplier = displayLandMultiplier;
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
          <Typography.Text strong>
            Do you have an estimate of the cost required to implement the
            scenarios?
          </Typography.Text>
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
                CaseUIState.update((s) => {
                  s.general.isRoiExpandedAll = true;
                  s.general.isRoiExpandedSegments = {};
                });
              }}
            />
          </Form.Item>
        </Col>
      </Row>
      {(costAllocationMode === "per_segment" ||
        costAllocationMode === "all_farmers") && (
        <>
          <div
            style={{
              background: "#eaf2f2",
              borderRadius: "12px",
              padding: "20px",
              marginTop: "20px",
              border: "1px solid rgba(27, 98, 95, 0.1)",
              lineHeight: "1.5",
            }}
          >
            <Text style={{ color: "#26605f" }}>
              Please input the net cost of implementing the scenario, taking
              into account all fixed and variable cost as well as the potential
              revenue created (e.g, farmer payments for trainings). You can
              either input the total cost of the scenario as a whole, or break
              it down by component.
            </Text>
          </div>
          <Row
            align="middle"
            justify="space-between"
            style={{
              padding: "20px 0",
              borderTop: "1px solid #f0f0f0",
            }}
          >
          <Col span={24}>
            <Space direction="vertical" style={{ width: "100%" }}>
              {costAllocationMode === "all_farmers" ? (
                <Typography.Text strong>
                  Scenario cost for all farmers
                </Typography.Text>
              ) : (
                <Row
                  align="middle"
                  justify="space-between"
                  style={{ width: "100%" }}
                >
                  <Col>
                    <Typography.Text strong>
                      Scenario cost for segment
                    </Typography.Text>
                  </Col>
                  <Col>
                    <Radio.Group
                      className="roi-segment-selector"
                      value={activeSegmentId}
                      onChange={(e) => {
                        const val = e.target.value;
                        CaseUIState.update((s) => {
                          s.general.activeSegmentId = val;
                        });
                      }}
                    >
                      {orderBy(currentCase.segments, ["id"]).map((seg) => (
                        <Radio.Button
                          key={seg.id}
                          value={seg.id}
                          style={{ fontWeight: "normal" }}
                        >
                          {seg.name}
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Col>
                </Row>
              )}
            </Space>
          </Col>
          </Row>
        </>
      )}

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.cost_allocation_mode !== currentValues.cost_allocation_mode
        }
      >
        {({ getFieldValue }) =>
          getFieldValue("cost_allocation_mode") !== "no" &&
          // Fallback for cases where mode is not yet set but is_roi_enabled is true
          (typeof getFieldValue("cost_allocation_mode") !== "undefined" ||
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
              <Row align="top" gutter={16}>
                <Col
                  onClick={() => {
                    CaseUIState.update((s) => {
                      if (costAllocationMode === "all_farmers") {
                        s.general.isRoiExpandedAll = !isRoiExpanded;
                      } else if (costAllocationMode === "per_segment") {
                        s.general.isRoiExpandedSegments[segmentId] =
                          !isRoiExpanded;
                      }
                    });
                  }}
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
                  <Space
                    direction="vertical"
                    size={2}
                    style={{ width: "100%" }}
                  >
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
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.cost_unit !== currentValues.cost_unit
                      }
                    >
                      {({ getFieldValue }) => {
                        const unit = getFieldValue("cost_unit");
                        if (unit === "total") {
                          return null;
                        }
                        return (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "rgba(0,0,0,0.45)",
                              paddingLeft: "4px",
                            }}
                          >
                            {unit === "per_farmer"
                              ? `x ${InputNumberThousandFormatter.formatter(
                                  displayFarmers
                                )} Farmers`
                              : unit === "per_land_unit"
                              ? `x ${InputNumberThousandFormatter.formatter(
                                  displayLandMultiplier.toFixed(2)
                                )} Total Land Area`
                              : ""}
                          </div>
                        );
                      }}
                    </Form.Item>
                  </Space>
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
                        width: "35%",
                        onCell: () => ({ style: { verticalAlign: "top" } }),
                        render: (text, record, index) => (
                          <Space direction="vertical" style={{ width: "100%" }}>
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
                            {text === "Other" && (
                              <Form.Item style={{ marginBottom: 0 }}>
                                <Input
                                  placeholder="Specify other component..."
                                  maxLength={30}
                                  showCount
                                  disabled={!enableEditCase}
                                  value={record.otherName || ""}
                                  onChange={(e) =>
                                    onComponentChange(
                                      index,
                                      "otherName",
                                      e.target.value
                                    )
                                  }
                                  style={{ marginTop: "4px" }}
                                />
                              </Form.Item>
                            )}
                          </Space>
                        ),
                      },
                      {
                        title: "Cost type",
                        dataIndex: "unit",
                        width: "20%",
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
                        width: "20%",
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
                                      displayFarmers
                                    )} Farmers`
                                  : record.unit === "per_land_unit"
                                  ? `x ${InputNumberThousandFormatter.formatter(
                                      displayLandMultiplier.toFixed(2)
                                    )} Total Land Area`
                                  : ""}
                              </div>
                            )}
                          </Space>
                        ),
                      },
                      {
                        title: "Total",
                        key: "total_cost",
                        align: "left",
                        width: "20%",
                        onCell: () => ({ style: { verticalAlign: "top" } }),
                        render: (_, record) => {
                          let multiplier = 1;
                          if (record.unit === "per_farmer") {
                            multiplier = displayFarmers;
                          } else if (record.unit === "per_land_unit") {
                            multiplier = displayLandMultiplier;
                          }

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
                        width: "5%",
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
