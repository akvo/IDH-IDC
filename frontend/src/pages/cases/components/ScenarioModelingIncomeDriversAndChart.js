import React, { useMemo, useState } from "react";
import { Row, Col, Form, InputNumber, TreeSelect } from "antd";
import { CaseUIState, CaseVisualState, CurrentCaseState } from "../store";
import {
  InputNumberThousandFormatter,
  flatten,
  getFunctionDefaultValue,
} from "../../../lib";
import { thousandFormatter } from "../../../components/chart/options/common";
import { isEmpty, orderBy, uniqBy } from "lodash";
import { customFormula } from "../../../lib/formula";
import { ChartSegmentsIncomeGapScenarioModeling } from "../visualizations";

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
    value: `${group.id}-${q.id}`, // commodityID - questionID
    label: q.text,
    selectable: q.question_type === "aggregator" ? false : true,
    children: generateDriverOptions({ group, questions: q.childrens }),
  }));
};

const Question = ({ index, segment, percentage }) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const { incomeDataDrivers } = CaseVisualState.useState((s) => s);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [newValue, setNewValue] = useState(null);
  const scenarioModelingForm = Form.useFormInstance();

  const fieldName = `${segment.id}-${index}`;

  const incomeDriverOptions = useMemo(() => {
    return incomeDataDrivers.map((driver) => ({
      value: driver.groupName,
      title: driver.groupName,
      selectable: false,
      children: driver.questionGroups.map((qg) => ({
        value: qg.id,
        label: qg.commodity_name,
        selectable: false,
        children: generateDriverOptions({
          group: qg,
          questions: qg.questions,
        }),
      })),
    }));
  }, [incomeDataDrivers]);

  const currentValue = useMemo(() => {
    if (selectedDriver) {
      return segment?.answers?.[`current-${selectedDriver}`] || 0;
    }
    return 0;
  }, [segment.answers, selectedDriver]);

  const currentIncrease = useMemo(() => {
    let newFormValue = newValue || 0;
    if (percentage) {
      const percentageField = `percentage-${segment.id}-${index}`;
      newFormValue = scenarioModelingForm.getFieldValue(percentageField);
    } else {
      const absoluteField = `absolute-${segment.id}-${index}`;
      newFormValue = scenarioModelingForm.getFieldValue(absoluteField);
    }
    if (percentage) {
      const value = currentValue * (newFormValue / 100);
      return newFormValue ? currentValue + value : 0;
    }
    const percent = newFormValue
      ? ((newFormValue - currentValue) / currentValue) * 100
      : 0;
    return isNaN(percent) ? 0 : percent.toFixed(2);
  }, [
    percentage,
    currentValue,
    segment?.id,
    index,
    newValue,
    scenarioModelingForm,
  ]);

  return (
    <Row gutter={[5, 5]} align="middle" style={{ marginTop: 10 }}>
      <Col span={8}>
        <Form.Item className="scenario-field-item" name={`driver-${fieldName}`}>
          <TreeSelect
            showSearch
            allowClear
            style={{ width: "100%" }}
            dropdownStyle={{ maxHeight: 400, overflow: "auto", width: "400px" }}
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

const ScenarioModelingIncomeDriversAndChart = ({
  segment,
  currentScenarioData,
}) => {
  const [scenarioDriversForm] = Form.useForm();
  const { incomeDataDrivers, questionGroups, totalIncomeQuestions } =
    CaseVisualState.useState((s) => s);
  const currentCase = CurrentCaseState.useState((s) => s);

  // Update child question feasible answer to 0 if the parent question is updated
  const flattenIncomeDataDriversQuestions = useMemo(() => {
    // combine with commodity value
    return incomeDataDrivers
      .flatMap((driver) => (!driver ? [] : flatten(driver.questionGroups)))
      .flatMap((group) => {
        const childQuestions = !group ? [] : flatten(group.questions);
        return childQuestions.map((cq) => ({
          case_commodity: group.id,
          ...group,
          ...cq,
        }));
      });
  }, [incomeDataDrivers]);

  const calculateChildrenValues = (question, fieldKey, values) => {
    const childrenQuestions = flattenIncomeDataDriversQuestions.filter(
      (q) => q.parent === question?.parent
    );
    const allChildrensIds = childrenQuestions.map((q) => `${fieldKey}-${q.id}`);
    const allChildrensValues = allChildrensIds.reduce((acc, id) => {
      const value = values?.[id];
      if (value) {
        acc.push({ id, value });
      }
      return acc;
    }, []);
    return uniqBy(allChildrensValues, "id");
  };

  const onScenarioModelingIncomeDriverFormValuesChange = (
    changedValue,
    allNewValues
  ) => {
    // recalculate drivers value by new value from scenario modeling form
    const recalculate = ({ key, updatedSegment }) => {
      const [fieldName, caseCommodityId, questionId] = key.split("-");
      const fieldKey = `${fieldName}-${caseCommodityId}`;

      const question = flattenIncomeDataDriversQuestions.find(
        (q) => q.id === parseInt(questionId)
      );
      const parentQuestion = flattenIncomeDataDriversQuestions.find(
        (q) => q.id === question?.parent
      );

      const allChildrensValues = calculateChildrenValues(
        question,
        fieldKey,
        updatedSegment.answers
      );
      const sumAllChildrensValues = parentQuestion?.default_value
        ? getFunctionDefaultValue(parentQuestion, fieldKey, allChildrensValues)
        : allChildrensValues.reduce((acc, { value }) => acc + value, 0);

      const parentQuestionField = `${fieldKey}-${question?.parent}`;
      if (parentQuestion) {
        // use parentValue if child is 0
        const parentValue = !sumAllChildrensValues
          ? updatedSegment.answers?.[parentQuestionField] || 0
          : sumAllChildrensValues;

        updatedSegment["answers"] = {
          ...updatedSegment["answers"],
          [parentQuestionField]: parentValue,
        };
      }

      if (parentQuestion?.parent) {
        recalculate({ key: parentQuestionField, updatedSegment });
      }
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
    // eol generate questions

    const valueKey = Object.keys(changedValue)[0];
    const [valueField, segmentId, index] = valueKey.split("-");

    const absoluteField = `absolute-${segmentId}-${index}`;
    const percentageField = `percentage-${segmentId}-${index}`;

    let newFeasibleValue = 0;
    const newValue = changedValue[valueKey];

    const driverDropdownKey = Object.keys(allNewValues).find(
      (key) =>
        key === `driver-${segmentId}-${index}` &&
        (allNewValues?.[key] || allNewValues?.[key] === 0)
    );
    const driverDropdownValue = allNewValues[driverDropdownKey];
    const [caseCommodityId, questionId] = driverDropdownValue
      ? driverDropdownValue.split("-")
      : [];

    // find childrens answer and reset to 0
    const findQuestion = flattenIncomeDataDriversQuestions.find(
      (q) =>
        q.case_commodity === parseInt(caseCommodityId) &&
        q.id === parseInt(questionId)
    );

    const flattenChildrens = !findQuestion
      ? []
      : flatten(findQuestion.childrens);

    const updatedChildAnswer = flattenChildrens
      .map((q) => {
        return {
          key: `current-${caseCommodityId}-${q.id}`,
          value: 0,
        };
      })
      .reduce((a, b) => {
        a[b.key] = b.value;
        return a;
      }, {});
    // EOL find childrens answer and reset to 0

    const segmentAnswerField = `current-${driverDropdownValue}`;
    const currentSegmentAnswer = segment.answers?.[segmentAnswerField];

    const currentScenarioValue = currentScenarioData.scenarioValues.find(
      (scenario) => scenario.segmentId === segment.id
    );
    const currentScenarioValueUpdatedSegment =
      currentScenarioValue?.updatedSegment?.answers || {};
    let updatedSegment = {
      ...segment,
      answers: {
        ...segment.answers,
        ...currentScenarioValueUpdatedSegment,
      },
    };

    // reset scenario value when driver changed or deleted
    if (valueField === "driver") {
      const prevSelectedDrivers = currentScenarioValue?.selectedDrivers || [];
      scenarioDriversForm.setFieldsValue({
        [absoluteField]: null,
        [percentageField]: null,
      });
      const findPrevSelectedDriverValue = prevSelectedDrivers.find(
        (d) => d.field === valueKey
      )?.value;
      // check if prev we have driver in same variables index
      if (findPrevSelectedDriverValue) {
        const prevSegmentAnswerField = `current-${findPrevSelectedDriverValue}`;
        const resetSegmentAnswer = segment?.answers?.[prevSegmentAnswerField];
        // reset segment answers
        updatedSegment = {
          ...updatedSegment,
          answers: {
            ...updatedSegment.answers,
            ...updatedChildAnswer,
            [prevSegmentAnswerField]: resetSegmentAnswer,
          },
        };
        recalculate({
          key: prevSegmentAnswerField,
          updatedSegment,
        });
      }
    }
    // EOL reset scenario value when driver changed or deleted

    // calculate percentage change
    if (
      valueField === "percentage" &&
      typeof currentSegmentAnswer !== "undefined"
    ) {
      const valueTmp = currentSegmentAnswer * (newValue / 100);
      newFeasibleValue = newValue ? currentSegmentAnswer + valueTmp : 0;
      scenarioDriversForm.setFieldValue(absoluteField, newFeasibleValue);
      allNewValues[absoluteField] = newFeasibleValue;
    }
    // EOL calculate percentage change

    // calculate absolute change
    if (
      valueField === "absolute" &&
      typeof currentSegmentAnswer !== "undefined"
    ) {
      newFeasibleValue = newValue;
      scenarioDriversForm.setFieldValue(percentageField, newFeasibleValue);
      allNewValues[percentageField] = newFeasibleValue;
    }
    // EOL calculate absolute change

    // CALCULATION :: calculate new total income based on driver change and new scenario value
    // assume the scenario modeling value to replace the current value
    if (newFeasibleValue || newFeasibleValue === 0) {
      // update segment answers current value with the new value from scenario modeling
      updatedSegment = {
        ...updatedSegment,
        answers: {
          ...updatedSegment.answers,
          ...updatedChildAnswer,
          [segmentAnswerField]: newFeasibleValue
            ? newFeasibleValue
            : currentSegmentAnswer,
        },
      };
      recalculate({
        key: segmentAnswerField,
        updatedSegment,
      });
    }
    // EOL CALCULATION

    // create new updated dashboardData for current scenario - segment
    const updatedSegmentScenarioValue = [updatedSegment].map((segment) => {
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
    })[0];
    // EOL create new updated dashboardData for current scenario - segment

    // Update scenario modeling global state
    let updatedScenarioValue = {};
    if (currentScenarioValue) {
      updatedScenarioValue = {
        ...updatedScenarioValue,
        ...currentScenarioValue,
        allNewValues: {
          ...currentScenarioValue.allNewValues,
          ...allNewValues,
        },
        selectedDrivers:
          valueField === "driver"
            ? uniqBy(
                [
                  ...currentScenarioValue.selectedDrivers.filter(
                    (x) => x.field !== valueKey
                  ),
                  {
                    field: valueKey,
                    value: newValue,
                  },
                ],
                "field"
              )
            : currentScenarioValue.selectedDrivers,
        updatedSegmentScenarioValue,
        updatedSegment,
      };
    } else {
      updatedScenarioValue = {
        ...updatedScenarioValue,
        segmentId: segment.id,
        name: segment.name,
        selectedDrivers:
          valueField === "driver" ? [{ field: valueKey, value: newValue }] : [],
        allNewValues,
        updatedSegmentScenarioValue,
        updatedSegment,
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
                  scenarioValues: orderBy(
                    [
                      ...scenario.scenarioValues.filter(
                        (item) => item.segmentId !== segment.id
                      ),
                      {
                        ...updatedScenarioValue,
                      },
                    ],
                    "segmentId"
                  ),
                };
              }
              return scenario;
            }
          ),
        },
      },
    }));
    // EOL Update scenario modeling global state
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
              Set up your scenario by selecting changes for up to 5 drivers. You
              can specify these changes as either a percentage or an absolute
              value. The graph on the right illustrates how these adjustments
              impact the gap across different segments.
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
                <Col span={6}>
                  {currentScenarioData?.percentage ? "Change" : "New Value"}
                </Col>
                <Col span={6} align="end">
                  Current Value
                </Col>
                <Col span={4} align="end">
                  {currentScenarioData?.percentage ? "New Value" : "Change"}
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
            <div style={{ marginTop: 24, fontWeight: "bold" }}>
              New total income:{" "}
              {thousandFormatter(
                currentScenarioData.scenarioValues.find(
                  (s) => s.segmentId === segment.id
                )?.updatedSegmentScenarioValue?.total_current_income || 0,
                2
              )}
            </div>
          </Col>
        </Row>
      </Col>
      <Col span={12}>
        <ChartSegmentsIncomeGapScenarioModeling
          currentScenarioData={currentScenarioData}
        />
      </Col>
    </Row>
  );
};

export default ScenarioModelingIncomeDriversAndChart;
