import React, { useMemo } from "react";
import { Row, Col, Form, Input, Select, InputNumber, TreeSelect } from "antd";
import { CaseUIState, CurrentCaseState, CaseVisualState } from "../store";
import { selectProps, InputNumberThousandFormatter } from "../../../lib";
import { VisualCardWrapper } from "./";
import { SegmentTabsWrapper } from "../layout";

// TODO :: The driver will be a dropdown list that include the sub drivers
const MAX_VARIABLES = [0, 1, 2, 3, 4];

const generateDriverOptions = ({ group, questions }) => {
  return questions.map((q) => ({
    value: `${q.text}#${group.id}-${q.id}`, //case_commodity_id-question_id
    label: q.text,
    children: generateDriverOptions({ group, questions: q.childrens }),
  }));
};

const Question = ({
  index,
  segment,
  form,
  qtype = "percentage",
  percentage = true,
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const { incomeDataDrivers } = CaseVisualState.useState((s) => s);

  const incomeDriverOptions = useMemo(() => {
    const options = incomeDataDrivers.map((driver) => {
      return {
        value: driver.groupName,
        title: driver.groupName,
        children: driver.questionGroups.map((qg) => {
          return {
            value: `${qg.commodity_name}-${qg.id}`,
            label: qg.commodity_name,
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

  return (
    <Row gutter={[5, 5]} align="middle" style={{ marginTop: 10 }}>
      <Col span={9}>
        <Form.Item
          className="scenario-field-item"
          name={`scenario_driver-${segment.id}-${index}`}
        >
          <TreeSelect
            {...selectProps}
            style={{
              width: "100%",
            }}
            // value={value}
            dropdownStyle={{
              maxHeight: 400,
              overflow: "auto",
            }}
            placeholder="Select driver"
            // onChange={onChange}
            treeData={incomeDriverOptions}
            disabled={!enableEditCase}
          />
        </Form.Item>
      </Col>
      <Col span={5}>
        {["absolute", "percentage"].map((qtype, index) => (
          <Form.Item
            key={`${qtype}-${index}`}
            // name={`${qtype}-${fieldName}`}
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
              // addonAfter={qtype === "percentage" ? "%" : ""}
              // disabled={disableTotalIncomeFocusCommodityField}
              {...InputNumberThousandFormatter}
              disabled={!enableEditCase}
            />
          </Form.Item>
        ))}
      </Col>
      <Col span={6} align="end">
        0
      </Col>
      <Col span={4} align="end">
        {/* {percentage
            ? thousandFormatter(currentIncrease)
            : `${currentIncrease} %`} */}
        0
      </Col>
    </Row>
  );
};

const ScenariIncomeoDriverAndChart = ({ segment }) => {
  const [scenarioDriversForm] = Form.useForm();

  return (
    <Row
      align="middle"
      gutter={[20, 20]}
      className="income-driver-form-container"
    >
      <Col span={10}>
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
            >
              <Row gutter={[5, 5]} align="middle">
                <Col span={9}>Income Driver</Col>
                <Col span={5}>New Value</Col>
                <Col span={6} align="end">
                  Current Value
                </Col>
                <Col span={4} align="end">
                  Change
                </Col>
              </Row>
              {MAX_VARIABLES.map((index) => (
                <Question
                  key={`scenario-${segment.id}-${index}`}
                  index={index}
                  // percentage={percentage}
                  segment={segment}
                  form={scenarioDriversForm}
                />
              ))}
            </Form>
          </Col>
        </Row>
      </Col>
      <Col span={14}>
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

  return (
    <Row gutter={[20, 20]} className="scenario-modeling-form-container">
      {/* Scenario Details Form */}
      <Col span={24}>
        <Form
          layout="vertical"
          name="scenario-modeling-detail-form"
          form={scenarioDetailForm}
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
        <SegmentTabsWrapper>
          <ScenariIncomeoDriverAndChart />
        </SegmentTabsWrapper>
      </Col>
      {/* EOL Scenario Income Drivers & Chart */}
    </Row>
  );
};

export default ScenarioModelingForm;
