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
import ScenarioModelingROIForm from "./ScenarioModelingROIForm";
import { InfoCircleOutlined, DeleteOutlined } from "@ant-design/icons";

const ScenarioModelingTabContent = ({
  segment,
  current,
  scenarioDetailForm,
  enableEditCase,
  scenarioModeling,
}) => (
  <>
    <ScenarioModelingIncomeDriversAndChart
      segment={segment}
      currentScenarioData={current}
    />
    <ScenarioModelingROIForm
      segment={segment}
      form={scenarioDetailForm}
      currentScenarioData={current}
      enableEditCase={enableEditCase}
      scenarioModeling={scenarioModeling}
    />
  </>
);

const ScenarioModelingForm = ({
  currentScenarioData,
  showDeleteButton,
  setActiveScenario,
  deleteButtonPosition,
}) => {
  const [scenarioDetailForm] = Form.useForm();
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const scenarioModeling = CaseVisualState.useState((s) => s.scenarioModeling);
  const { activeSegmentId } = CaseUIState.useState((s) => s.general);

  const [deleting, setDeleting] = useState(false);
  const [current, setCurrent] = useState(currentScenarioData);

  useEffect(() => {
    const { name, description, percentage } = currentScenarioData;
    const invAnalysis = scenarioModeling.config.investment_analysis || {};
    const scenarioInv = invAnalysis.scenarios?.[currentScenarioData.key] || {};

    const costAllocationMode =
      scenarioInv.cost_allocation_mode ||
      (scenarioInv.is_roi_enabled ? "per_segment" : "no");

    let investment_cost = 0;
    let cost_unit = "total";

    if (costAllocationMode === "all_farmers") {
      const allFarmersInv = scenarioInv.all_farmers_config;
      investment_cost = allFarmersInv?.investment_cost || 0;
      cost_unit = allFarmersInv?.cost_unit || "total";
    } else if (activeSegmentId) {
      const segmentInv = scenarioInv.segments?.[activeSegmentId];
      investment_cost = segmentInv?.investment_cost || 0;
      cost_unit = segmentInv?.cost_unit || "total";
    }

    scenarioDetailForm.setFieldsValue({
      name,
      description,
      percentage,
      cost_allocation_mode: costAllocationMode, // NEW
      is_roi_enabled: costAllocationMode !== "no", // Sync for listeners
      investment_cost,
      cost_unit,
    });
    setCurrent(currentScenarioData);
  }, [
    currentScenarioData,
    scenarioDetailForm,
    scenarioModeling.config.investment_analysis,
    activeSegmentId,
  ]);

  const onDeleteScenario = () => {
    setDeleting(true);
    const remainScenarios = scenarioModeling.config.scenarioData.filter(
      (sd) => sd.key !== currentScenarioData.key
    );
    CaseVisualState.update((s) => {
      s.scenarioModeling.config.scenarioData = remainScenarios;

      if (s.scenarioModeling.config.investment_analysis?.scenarios) {
        delete s.scenarioModeling.config.investment_analysis.scenarios[
          currentScenarioData.key
        ];
      }
    });
    setActiveScenario(remainScenarios[0]?.key);
    setCurrent(remainScenarios[0]);
    setDeleting(false);
  };

  const onScenarioDetailFormValuesChange = (changedValue) => {
    const isRoiChange = [
      "is_roi_enabled",
      "cost_allocation_mode",
      "investment_cost",
      "cost_unit",
    ].some((key) => Object.keys(changedValue).includes(key));

    CaseVisualState.update((s) => {
      const config = s.scenarioModeling.config;

      if (isRoiChange) {
        if (!config.investment_analysis) {
          config.investment_analysis = {
            is_enabled: false,
            scenarios: {},
            metadata: {
              currency: s.currentCase?.currency || "USD",
              last_updated: new Date().toISOString(),
            },
          };
        }

        const invAnalysis = config.investment_analysis;
        invAnalysis.metadata.last_updated = new Date().toISOString();

        if (typeof changedValue.is_roi_enabled !== "undefined") {
          invAnalysis.is_enabled = changedValue.is_roi_enabled;
        }

        if (typeof changedValue.cost_allocation_mode !== "undefined") {
          invAnalysis.is_enabled = changedValue.cost_allocation_mode !== "no";
        }

        const scenarioKey = currentScenarioData.key;
        if (!invAnalysis.scenarios[scenarioKey]) {
          invAnalysis.scenarios[scenarioKey] = {
            investment_cost: 0,
            cost_unit: "total",
            segments: {},
          };
        }

        const scenarioInv = invAnalysis.scenarios[scenarioKey];

        if (typeof changedValue.cost_allocation_mode !== "undefined") {
          scenarioInv.cost_allocation_mode = changedValue.cost_allocation_mode;
          scenarioInv.is_roi_enabled =
            changedValue.cost_allocation_mode !== "no";
        }

        const mode =
          scenarioInv.cost_allocation_mode ||
          (scenarioInv.is_roi_enabled ? "per_segment" : "no");

        let target;
        if (mode === "all_farmers") {
          if (!scenarioInv.all_farmers_config) {
            scenarioInv.all_farmers_config = {
              investment_cost: 0,
              cost_unit: "total",
              components: [],
            };
          }
          target = scenarioInv.all_farmers_config;
        } else if (activeSegmentId) {
          if (!scenarioInv.segments) {
            scenarioInv.segments = {};
          }
          if (!scenarioInv.segments[activeSegmentId]) {
            scenarioInv.segments[activeSegmentId] = {
              investment_cost: 0,
              components: [],
            };
          }
          target = scenarioInv.segments[activeSegmentId];
        }

        if (target) {
          if (typeof changedValue.investment_cost !== "undefined") {
            target.investment_cost = changedValue.investment_cost;
          }
          if (typeof changedValue.cost_unit !== "undefined") {
            target.cost_unit = changedValue.cost_unit;
          }
        }
      } else {
        config.scenarioData.forEach((scenario) => {
          if (scenario.key === currentScenarioData.key) {
            Object.assign(scenario, changedValue);
          }
        });
      }
    });
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
          <Row align="top" gutter={[20, 20]}>
            <Col span={6}>
              <Form.Item name="name" label="Give your scenario a name">
                <Input
                  disabled={!enableEditCase}
                  maxLength={15}
                  showCount={true}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="description"
                label="Provide a short description of this scenario for future reference"
              >
                <Input.TextArea disabled={!enableEditCase} rows={1} />
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
          <Row gutter={[24, 10]}>
            <Col span={24}>
              <SegmentTabsWrapper>
                <ScenarioModelingTabContent
                  key="left"
                  current={current}
                  scenarioDetailForm={scenarioDetailForm}
                  enableEditCase={enableEditCase}
                  scenarioModeling={scenarioModeling}
                />
              </SegmentTabsWrapper>
            </Col>
          </Row>
        </Form>
      </Col>
    </Row>
  );
};

export default ScenarioModelingForm;
