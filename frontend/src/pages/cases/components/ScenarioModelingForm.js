import React, { useMemo } from "react";
import { Row, Col, Form, Input, Select, InputNumber } from "antd";
import { CaseUIState, CurrentCaseState, CaseVisualState } from "../store";
import { selectProps, InputNumberThousandFormatter } from "../../../lib";
import { VisualCardWrapper } from "./";
import { orderBy } from "lodash";
import { commodities } from "../../../store/static";
import { thousandFormatter } from "../../../components/chart/options/common";
import { SegmentTabsWrapper } from "../layout";

// TODO :: The driver will be a dropdown list that include the sub drivers
const MAX_VARIABLES = [0, 1, 2, 3, 4];

const Question = ({
  segment,
  form,
  qtype = "percentage",
  percentage = true,
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  return (
    <Row
      gutter={[5, 5]}
      align="middle"
      style={{ marginTop: 10 }}
      // display={
      //   question_type === "aggregator" && commodity_type === "focus"
      //     ? "none"
      //     : ""
      // }
    >
      <Col span={9}>
        <Select
          {...selectProps}
          placeholder="Select driver"
          options={[{ label: "TEST", value: 1 }]}
          optionRender={(index) => <div key={index}>Option {index}</div>}
        />
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

  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);
  const { questionGroups, scenarioModeling } = CaseVisualState.useState(
    (s) => s
  );

  const commodityQuestions = useMemo(() => {
    // Focus
    const focusQuestion = currentCase.case_commodities
      .filter((c) => c.commodity_type === "focus")
      .map((c) => {
        const findQG = questionGroups.find(
          (qg) => qg.commodity_id === c.commodity
        );
        // add case_commodity to questions
        return {
          ...c,
          ...findQG,
          case_commodity: c.id,
          questions: findQG.questions.map((q) => ({
            ...q,
            case_commodity: c.id,
          })),
        };
      });
    // Group secondary & tertiary into diversified
    const additionalDiversifed = currentCase.case_commodities
      .filter(
        (c) =>
          c.commodity_type !== "focus" && c.commodity_type !== "diversified"
      )
      .flatMap((c) => {
        const findQG = questionGroups.find(
          (qg) => qg.commodity_id === c.commodity
        );
        return {
          ...c,
          ...findQG,
          case_commodity: c.id,
          questions: findQG.questions.map((q) => ({
            ...q,
            case_commodity: c.id,
          })),
        };
      });
    // Diversified
    const diversified = currentCase.case_commodities.find(
      (c) => c.commodity_type === "diversified"
    );
    const findDiversifiedQG = questionGroups.find(
      (qg) => qg.commodity_id === diversified.commodity
    );
    const groupedDiversifiedQuestion = [
      ...additionalDiversifed.flatMap((a) => a.questions),
      ...findDiversifiedQG.questions.map((q) => ({
        ...q,
        case_commodity: diversified.id,
      })),
    ];
    const diversifiedQuestion = {
      ...diversified,
      ...findDiversifiedQG,
      case_commodity: [
        diversified.id,
        ...additionalDiversifed.map((a) => a.id),
      ]?.join("_"),
      questions: [
        {
          ...findDiversifiedQG.questions[0],
          id: "diversified",
          default_value: groupedDiversifiedQuestion
            .map((x) => `#${x.id}`)
            .join(" + "),
          parent: null,
          question_type: "diversified",
          text: "Diversified Income",
          description: "Custom question",
          childrens: groupedDiversifiedQuestion,
        },
      ],
    };
    return [...focusQuestion, diversifiedQuestion];
  }, [currentCase.case_commodities, questionGroups]);

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
                  // commodity={commodity}
                  // percentage={percentage}
                  segment={segment}
                  form={scenarioDriversForm}
                  // enableEditCase={enableEditCase}
                  // {...child}
                  // refreshCurrentIncrease={refreshCurrentIncrease}
                />
              ))}
              {/* {commodityQuestions.map((c) => (
                <div key={c.commodity_id}>
                  {orderBy(c.questions, ["id"]).map((question) => (
                    <Question
                      key={`scenario-${segment.id}-${c.case_commodity}-${question.id}`}
                      // form={form}
                      segment={segment}
                      commodity={c}
                      percentage={scenarioModeling?.config?.percentage || false}
                      {...question}
                      enableEditCase={enableEditCase}
                      form={scenarioDriversForm}
                      // refreshCurrentIncrease={refreshCurrentIncrease}
                    />
                  ))}
                </div>
              ))} */}
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
