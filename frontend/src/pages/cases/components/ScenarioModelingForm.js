import React, { useMemo, useState } from "react";
import { Row, Col, Form, Input, Select, InputNumber, TreeSelect } from "antd";
import { CaseUIState, CaseVisualState, CurrentCaseState } from "../store";
import {
  selectProps,
  InputNumberThousandFormatter,
  flatten,
  getFunctionDefaultValue,
} from "../../../lib";
import { VisualCardWrapper } from "./";
import { SegmentTabsWrapper } from "../layout";
import { thousandFormatter } from "../../../components/chart/options/common";
import { isEmpty } from "lodash";
import { customFormula } from "../../../lib/formula";

const MAX_VARIABLES = [0, 1, 2, 3, 4];

const masterCommodityCategories = window.master?.commodity_categories || [];
const commodityNames = masterCommodityCategories.reduce((acc, curr) => {
  const commodities = curr.commodities.reduce((a, c) => {
    return { ...a, [c.id]: c.name };
  }, {});
  return { ...acc, ...commodities };
}, {});

const generateDriverOptions = ({ group, questions }) => {
  return questions.map((q) => ({
    value: `${group.id}-${q.id}`,
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
    return incomeDataDrivers.map((driver) => ({
      value: driver.groupName,
      title: driver.groupName,
      disabled: true,
      children: driver.questionGroups.map((qg) => ({
        value: qg.id,
        label: qg.commodity_name,
        disabled: true,
        children: generateDriverOptions({
          group: qg,
          questions: qg.questions,
        }),
      })),
    }));
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
            style={{ width: "100%" }}
            dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
            placeholder="Select driver"
            onChange={(value) => setSelectedDriver(value)}
            treeData={incomeDriverOptions}
            disabled={!enableEditCase}
            treeNodeFilterProp="label"
          />
        </Form.Item>
      </Col>
      <Col span={6}>
        {["absolute", "percentage"].map((qtype) => (
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
              style={{ width: "100%" }}
              controls={false}
              addonAfter={percentage ? "%" : ""}
              {...InputNumberThousandFormatter}
              disabled={!enableEditCase}
              onChange={(val) => setNewValue(val)}
            />
          </Form.Item>
        ))}
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
  const { incomeDataDrivers, questionGroups, totalIncomeQuestions } =
    CaseVisualState.useState((s) => s);
  const currentCase = CurrentCaseState.useState((s) => s);

  const onScenarioModelingIncomeDriverFormValuesChange = (
    changedValue,
    allNewValues
  ) => {
    // CALCULATION :: calculate new total income based on driver change
    // assume new value is the feasible value
    const valueKey = Object.keys(changedValue)[0];
    const [valueField, segmentId, index] = valueKey.split("-");

    const driverDropdownKey = Object.keys(allNewValues).find(
      (key) =>
        key === `driver-${segmentId}-${index}` &&
        (allNewValues?.[key] || allNewValues?.[key] === 0)
    );
    // const [field, segmentId, index] = driverDropdownKey.split("-");
    const driverDropdownValue = allNewValues[driverDropdownKey];
    const [caseCommodityId, questionId] = driverDropdownValue
      ? driverDropdownValue.split("-")
      : [];

    let newFeasibleValue = 0;
    const newValue = changedValue[valueKey];
    const currentSegmentAnswer =
      segment.answers?.[`current-${driverDropdownValue}`];

    if (
      valueField === "percentage" &&
      typeof currentSegmentAnswer !== "undefined"
    ) {
      const valueTmp = currentSegmentAnswer * (newValue / 100);
      newFeasibleValue = newValue ? currentSegmentAnswer + valueTmp : 0;
    }

    if (
      valueField === "absolute" &&
      typeof currentSegmentAnswer !== "undefined"
    ) {
      newFeasibleValue = newValue;
    }

    // Update child question feasible answer to 0 if the parent question is updated
    const flattenIncomeDataDriversQuestions = incomeDataDrivers
      .flatMap((driver) => (!driver ? [] : flatten(driver.questionGroups)))
      .flatMap((group) => {
        const childQuestions = !group ? [] : flatten(group.questions);
        return childQuestions.map((cq) => ({
          case_commodity: group.id,
          ...group,
          ...cq,
        }));
      }); // combine with commodity value

    const findQuestion = flattenIncomeDataDriversQuestions.find(
      (q) =>
        q.case_commodity === parseInt(caseCommodityId) &&
        q.id === parseInt(questionId)
    );
    const flattenChildrens = !findQuestion
      ? []
      : flatten(findQuestion.childrens);
    const updatedChildAnswer = flattenChildrens
      .map((q) => ({
        key: `feasible-${caseCommodityId}-${q.id}`,
        value: 0,
      }))
      .reduce((a, b) => {
        a[b.key] = b.value;
        return a;
      }, {});

    // update segment answers for change driver
    const updatedSegment = {
      ...segment,
      answers: {
        ...segment.answers,
        [`feasible-${driverDropdownValue}`]: newFeasibleValue,
        ...updatedChildAnswer,
      },
    };

    // generate questions
    const flattenedQuestionGroups = questionGroups.flatMap((group) => {
      const questions = group ? flatten(group.questions) : [];
      return questions.map((q) => ({
        ...q,
        commodity_id: group.commodity_id,
      }));
    });
    const totalCommodityQuestions = flattenedQuestionGroups.filter(
      (q) => q.question_type === "aggregator"
    );
    const costQuestions = flattenedQuestionGroups.filter((q) =>
      q.text.toLowerCase().includes("cost")
    );

    const updatedDasboardData = [updatedSegment].map((segment) => {
      const answers = isEmpty(segment?.answers) ? {} : segment.answers;
      const remappedAnswers = Object.keys(answers).map((key) => {
        const [fieldKey, caseCommodityId, questionId] = key.split("-");
        const commodity = currentCase.case_commodities.find(
          (cc) => cc.id === parseInt(caseCommodityId)
        );
        const commodityFocus = commodity?.commodity_type === "focus";
        const totalCommodityValue = totalCommodityQuestions.find(
          (q) => q.id === parseInt(questionId)
        );
        const cost = costQuestions.find(
          (q) =>
            q.id === parseInt(questionId) &&
            q.parent === 1 &&
            q.commodityId === commodity.commodity
        );
        const question = flattenedQuestionGroups.find(
          (q) =>
            q.id === parseInt(questionId) &&
            q.commodity_id === commodity.commodity
        );
        const totalOtherDiversifiedIncome =
          question?.question_type === "diversified" && !question.parent;
        return {
          name: fieldKey,
          question: question,
          commodityFocus: commodityFocus,
          commodityType: commodity?.commodity_type,
          caseCommodityId: parseInt(caseCommodityId),
          commodityId: commodity?.commodity,
          commodityName: commodityNames?.[commodity?.commodity],
          questionId: parseInt(questionId),
          value: answers?.[key] || 0, // if not found set as 0 to calculated inside array reduce
          isTotalFeasibleFocusIncome:
            totalCommodityValue && commodityFocus && fieldKey === "feasible"
              ? true
              : false,
          isTotalFeasibleDiversifiedIncome:
            totalCommodityValue && !commodityFocus && fieldKey === "feasible"
              ? true
              : totalOtherDiversifiedIncome && fieldKey === "feasible"
              ? true
              : false,
          isTotalCurrentFocusIncome:
            totalCommodityValue && commodityFocus && fieldKey === "current"
              ? true
              : false,
          isTotalCurrentDiversifiedIncome:
            totalCommodityValue && !commodityFocus && fieldKey === "current"
              ? true
              : totalOtherDiversifiedIncome && fieldKey === "current"
              ? true
              : false,
          feasibleCost:
            cost && answers[key] && fieldKey === "feasible" ? true : false,
          currentCost:
            cost && answers[key] && fieldKey === "current" ? true : false,
          costName: cost ? cost.text : "",
        };
      });

      const totalCurrentIncomeAnswer = totalIncomeQuestions
        .map((qs) => segment?.answers?.[`current-${qs}`] || 0)
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      const totalFeasibleIncomeAnswer = totalIncomeQuestions
        .map((qs) => segment?.answers?.[`feasible-${qs}`] || 0)
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);

      const totalCostFeasible = remappedAnswers
        .filter((a) => a.feasibleCost)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalCostCurrent = remappedAnswers
        .filter((a) => a.currentCost)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalFeasibleFocusIncome = remappedAnswers
        .filter((a) => a.isTotalFeasibleFocusIncome)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalFeasibleDiversifiedIncome = remappedAnswers
        .filter((a) => a.isTotalFeasibleDiversifiedIncome)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalCurrentFocusIncome = remappedAnswers
        .filter((a) => a.isTotalCurrentFocusIncome)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalCurrentDiversifiedIncome = remappedAnswers
        .filter((a) => a.isTotalCurrentDiversifiedIncome)
        .reduce((acc, curr) => acc + curr.value, 0);

      const focusCommodityAnswers = remappedAnswers
        .filter((a) => a.commodityType === "focus")
        .map((a) => ({
          id: `${a.name}-${a.questionId}`,
          value: a.value,
        }));

      const currentRevenueFocusCommodity = getFunctionDefaultValue(
        { default_value: customFormula.revenue_focus_commodity },
        "current",
        focusCommodityAnswers
      );
      const feasibleRevenueFocusCommodity = getFunctionDefaultValue(
        { default_value: customFormula.revenue_focus_commodity },
        "feasible",
        focusCommodityAnswers
      );
      const currentFocusCommodityCoP = getFunctionDefaultValue(
        { default_value: customFormula.focus_commodity_cost_of_production },
        "current",
        focusCommodityAnswers
      );
      const feasibleFocusCommodityCoP = getFunctionDefaultValue(
        { default_value: customFormula.focus_commodity_cost_of_production },
        "feasible",
        focusCommodityAnswers
      );

      return {
        ...segment,
        total_current_income: totalCurrentIncomeAnswer,
        total_feasible_income: totalFeasibleIncomeAnswer,
        total_feasible_cost: -totalCostFeasible,
        total_current_cost: -totalCostCurrent,
        total_feasible_focus_income: totalFeasibleFocusIncome,
        total_feasible_diversified_income: totalFeasibleDiversifiedIncome,
        total_current_focus_income: totalCurrentFocusIncome,
        total_current_diversified_income: totalCurrentDiversifiedIncome,
        total_current_revenue_focus_commodity: currentRevenueFocusCommodity,
        total_feasible_revenue_focus_commodity: feasibleRevenueFocusCommodity,
        total_current_focus_commodity_cost_of_production:
          currentFocusCommodityCoP,
        total_feasible_focus_commodity_cost_of_production:
          feasibleFocusCommodityCoP,
        answers: remappedAnswers,
      };
    });

    const currentScenarioValue = currentScenarioData.scenarioValues.find(
      (scenario) => scenario.segmentId === segment.id
    );

    let updatedScenarioValue = {};
    if (currentScenarioValue) {
      updatedScenarioValue = {
        ...updatedScenarioValue,
        ...currentScenarioValue,
        allNewValues: {
          ...currentScenarioValue.allNewValues,
          ...allNewValues,
        },
        updatedDasboardData,
      };
    } else {
      updatedScenarioValue = {
        ...updatedScenarioValue,
        segmentId: segment.id,
        name: segment.name,
        allNewValues,
        updatedDasboardData,
      };
    }

    // update state value
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
                      ...updatedScenarioValue,
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
              name={`scenario-modeling-income-driver-form-${segment.id}`}
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
              {MAX_VARIABLES.map((index) => (
                <Question
                  key={`scenario-${currentScenarioData.key}-${segment.id}-${index}`}
                  index={index}
                  segment={segment}
                  percentage={currentScenarioData.percentage}
                />
              ))}
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
          <ScenariIncomeoDriverAndChart
            currentScenarioData={currentScenarioData}
          />
        </SegmentTabsWrapper>
      </Col>
    </Row>
  );
};

export default ScenarioModelingForm;
