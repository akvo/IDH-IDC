import React, { useMemo, useState } from "react";
import { Row, Col, Form, Input, Select, InputNumber, TreeSelect } from "antd";
import { CaseUIState, CaseVisualState } from "../store";
import { selectProps, InputNumberThousandFormatter } from "../../../lib";
import { VisualCardWrapper } from "./";
import { SegmentTabsWrapper } from "../layout";
import { thousandFormatter } from "../../../components/chart/options/common";
import { isEmpty } from "lodash";

const MAX_VARIABLES = [0, 1, 2, 3, 4];

const generateDriverOptions = ({ group, questions }) => {
  return questions.map((q) => ({
    value: `${group.id}-${q.id}`, //case_commodity_id-question_id
    label: q.text,
    children: generateDriverOptions({ group, questions: q.childrens }),
  }));
};

const Question = ({ index, segment, percentage }) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const { incomeDataDrivers } = CaseVisualState.useState((s) => s);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [newValue, setNewValue] = useState(null);

  const fieldName = `${segment.id}-${index}`;

  const incomeDriverOptions = useMemo(() => {
    const options = incomeDataDrivers.map((driver) => {
      return {
        value: driver.groupName,
        title: driver.groupName,
        disabled: true,
        children: driver.questionGroups.map((qg) => {
          return {
            value: qg.id,
            label: qg.commodity_name,
            disabled: true,
            children: generateDriverOptions({
              group: qg,
              questions: qg.questions,
            }),
          };
        }),
      };
    });
    return options;
  }, [incomeDataDrivers]);

  const currentValue = useMemo(() => {
    if (selectedDriver) {
      return segment?.answers?.[`current-${selectedDriver}`];
    }
    return 0;
  }, [segment.answers, selectedDriver]);

  const currentIncrease = useMemo(() => {
    if (percentage) {
      const value = currentValue * (newValue / 100);
      return newValue ? currentValue + value : 0;
    }
    const percent = newValue
      ? ((newValue - currentValue) / currentValue) * 100
      : 0;
    return isNaN(percent) ? 0 : percent.toFixed(2);
  }, [percentage, newValue, currentValue]);

  return (
    <Row gutter={[5, 5]} align="middle" style={{ marginTop: 10 }}>
      <Col span={8}>
        <Form.Item className="scenario-field-item" name={`driver-${fieldName}`}>
          <TreeSelect
            showSearch
            allowClear
            style={{
              width: "100%",
            }}
            // value={value}
            dropdownStyle={{
              maxHeight: 400,
              overflow: "auto",
            }}
            placeholder="Select driver"
            onChange={(value) => setSelectedDriver(value)}
            treeData={incomeDriverOptions}
            disabled={!enableEditCase}
            treeNodeFilterProp="label"
          />
        </Form.Item>
      </Col>
      <Col span={6}>
        {["absolute", "percentage"].map((qtype) => {
          return (
            <Form.Item
              key={`${qtype}-${fieldName}`}
              name={`${qtype}-${fieldName}`}
              className="scenario-field-item"
              style={{
                display:
                  qtype !== "percentage" && percentage
                    ? "none"
                    : qtype === "percentage" && !percentage
                    ? "none"
                    : "",
              }}
            >
              <InputNumber
                style={{
                  width: "100%",
                }}
                controls={false}
                addonAfter={percentage ? "%" : ""}
                {...InputNumberThousandFormatter}
                disabled={!enableEditCase}
                onChange={(val) => setNewValue(val)}
              />
            </Form.Item>
          );
        })}
      </Col>
      <Col span={6} align="end">
        {thousandFormatter(currentValue, 2)}
      </Col>
      <Col span={4} align="end">
        {percentage
          ? thousandFormatter(currentIncrease)
          : `${currentIncrease} %`}
      </Col>
    </Row>
  );
};

const ScenariIncomeoDriverAndChart = ({ segment, currentScenarioData }) => {
  const [scenarioDriversForm] = Form.useForm();

  const onScenarioModelingIncomeDriverFormValuesChange = (_, allNewValues) => {
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
                  scenarioValues: [
                    ...scenario.scenarioValues.filter(
                      (item) => item.segmentId !== segment.id
                    ),
                    {
                      segmentId: segment.id,
                      name: segment.name,
                      allNewValues: allNewValues,
                    },
                  ],
                };
              }
              return scenario;
            }
          ),
        },
      },
    }));
  };

  const initialScenarioModelingIncomeDriverValues = useMemo(() => {
    if (currentScenarioData?.scenarioValues?.length) {
      const values = currentScenarioData.scenarioValues.find(
        (data) => data.segmentId === segment.id
      );
      return isEmpty(values) ? {} : values.allNewValues;
    }
    return {};
  }, [segment.id, currentScenarioData.scenarioValues]);

  return (
    <Row
      align="middle"
      gutter={[20, 20]}
      className="income-driver-form-container"
    >
      <Col span={12}>
        <Row
          gutter={[50, 50]}
          align="middle"
          className="income-driver-form-section"
        >
          <Col span={24}>
            <div className="title">
              You can select up to 5 variables to change
            </div>
            <div className="description">
              Make sure that you select variables you can influence/are within
              your control.
            </div>
          </Col>
          <Col span={24}>
            <Form
              layout="vertical"
              name="scenario-modeling-income-driver-form"
              form={scenarioDriversForm}
              onValuesChange={onScenarioModelingIncomeDriverFormValuesChange}
              initialValues={initialScenarioModelingIncomeDriverValues}
            >
              <Row gutter={[5, 5]} align="middle">
                <Col span={8}>Income Driver</Col>
                <Col span={6}>New Value</Col>
                <Col span={6} align="end">
                  Current Value
                </Col>
                <Col span={4} align="end">
                  Change
                </Col>
              </Row>
              {MAX_VARIABLES.map((index) => {
                return (
                  <Question
                    key={`scenario-${currentScenarioData.key}-${segment.id}-${index}`}
                    index={index}
                    segment={segment}
                    form={scenarioDriversForm}
                    {...currentScenarioData}
                  />
                );
              })}
            </Form>
          </Col>
        </Row>
      </Col>
      <Col span={12}>
        <VisualCardWrapper
          title="Optimal driver values to reach your target"
          bordered
        >
          Chart
        </VisualCardWrapper>
      </Col>
    </Row>
  );
};

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
      {/* Scenario Details Form */}
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
              <Form.Item name="percentage" label="Choose approach">
                <Select
                  {...selectProps}
                  disabled={!enableEditCase}
                  options={[
                    {
                      label: "Percentage",
                      value: true,
                    },
                    {
                      label: "Absolute",
                      value: false,
                    },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Col>
      {/* EOL Scenario Details Form */}

      {/* Scenario Income Drivers & Chart */}
      <Col span={24}>
        <SegmentTabsWrapper>
          <ScenariIncomeoDriverAndChart
            currentScenarioData={currentScenarioData}
          />
        </SegmentTabsWrapper>
      </Col>
      {/* EOL Scenario Income Drivers & Chart */}
    </Row>
  );
};

export default ScenarioModelingForm;
