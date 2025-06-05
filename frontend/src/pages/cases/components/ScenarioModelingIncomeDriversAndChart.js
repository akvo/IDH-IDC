import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, InputNumber } from "antd";
import { CaseUIState, CaseVisualState, CurrentCaseState } from "../store";
import {
  InputNumberThousandFormatter,
  flatten,
  getFunctionDefaultValue,
} from "../../../lib";
import { thousandFormatter } from "../../../components/chart/options/common";
import { isEmpty, orderBy, uniq, uniqBy } from "lodash";
import { customFormula } from "../../../lib/formula";
import { ChartSegmentsIncomeGapScenarioModeling } from "../visualizations";
import AllDriverTreeSelector from "./AllDriverTreeSelector";

const MAX_VARIABLES = [0, 1, 2, 3, 4];

const masterCommodityCategories = window.master?.commodity_categories || [];
const commodityNames = masterCommodityCategories.reduce((acc, curr) => {
  const commodities = curr.commodities.reduce((a, c) => {
    return { ...a, [c.id]: c.name };
  }, {});
  return { ...acc, ...commodities };
}, {});

const Question = ({
  index,
  segment,
  percentage,
  currentScenarioData,
  initialValues,
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [newValue, setNewValue] = useState(null);
  const scenarioModelingForm = Form.useFormInstance();
  const { globalSectionTotalValues } = CaseVisualState.useState((s) => s);

  const fieldName = `${currentScenarioData.key}-${segment.id}-${index}`;

  useEffect(() => {
    // load initial value manually
    if (isEmpty(initialValues)) {
      return;
    }
    const driverSelectField = `driver-${fieldName}`;
    Object.entries(initialValues).forEach(([key, value]) => {
      if (key === driverSelectField) {
        setSelectedDriver(value);
      } else {
        scenarioModelingForm.setFieldValue(key, value);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const currentSelectedDriversValue = useMemo(() => {
    const findScenario = currentScenarioData?.scenarioValues?.find(
      (sv) => sv.segmentId === segment.id
    );
    return findScenario?.selectedDrivers?.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.value]: curr.field,
      }),
      {}
    );
  }, [currentScenarioData?.scenarioValues, segment?.id]);

  const currentValue = useMemo(() => {
    if (selectedDriver) {
      if (selectedDriver.includes("diversified")) {
        return (
          globalSectionTotalValues.find((g) => g.segmentId === segment.id)
            ?.sectionTotalValues?.diversified?.current || 0
        );
      }
      return segment?.answers?.[`current-${selectedDriver}`] || 0;
    }
    return 0;
  }, [segment.answers, selectedDriver, globalSectionTotalValues, segment.id]);

  const currentIncrease = useMemo(() => {
    let newFormValue = newValue || 0;
    if (percentage) {
      const percentageField = `percentage-${fieldName}`;
      newFormValue = scenarioModelingForm.getFieldValue(percentageField);
    } else {
      const absoluteField = `absolute-${fieldName}`;
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
  }, [percentage, currentValue, newValue, scenarioModelingForm, fieldName]);

  return (
    <Row gutter={[5, 5]} align="middle" style={{ marginTop: 10 }}>
      <Col span={11}>
        <Form.Item className="scenario-field-item" name={`driver-${fieldName}`}>
          <AllDriverTreeSelector
            onChange={(value) => setSelectedDriver(value)}
            value={selectedDriver}
            dropdownStyle={{
              width: "400px",
            }}
            segment={segment}
            disabledNodes={currentSelectedDriversValue}
          />
        </Form.Item>
      </Col>
      <Col span={5}>
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
      <Col span={4} align="end">
        {thousandFormatter(currentValue, 2)}
      </Col>
      <Col span={4} align="end">
        {percentage
          ? thousandFormatter(currentIncrease, 2)
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
  const {
    incomeDataDrivers,
    questionGroups,
    totalIncomeQuestions,
    dashboardData,
    globalSectionTotalValues,
  } = CaseVisualState.useState((s) => s);
  const currentCase = CurrentCaseState.useState((s) => s);
  const [refreshBackward, setRefreshBackward] = useState(true);

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

  const currentDashboardData = useMemo(() => {
    return dashboardData.find((d) => d.id === segment.id);
  }, [segment, dashboardData]);

  // handle backward compatibility with old value
  const backwardScenarioData = useMemo(() => {
    if (!globalSectionTotalValues?.length || !refreshBackward) {
      return currentScenarioData;
    }
    const backwardScenarioValues = currentScenarioData?.scenarioValues?.map(
      (sv) => {
        if (isEmpty(sv.allNewValues)) {
          return sv;
        }
        const fieldNameTmp = `${currentScenarioData.key}-${sv.segmentId}`;
        // check if it is old value
        const allNewValuesKeys = Object.keys(sv?.allNewValues || {})?.map(
          (key) => key.split("-")[0]
        );
        const isBackward = allNewValuesKeys?.length
          ? !allNewValuesKeys.includes("driver")
          : false;

        let updatedSegment = sv?.updatedSegment || {};
        let updatedSegmentScenarioValue = sv?.updatedSegmentScenarioValue || {};

        if (isBackward) {
          // backward for old value
          const qids = uniq(
            Object.keys(sv.allNewValues).map((key) => key.split("-")[2])
          ).filter((qid) => qid !== "1");

          let backwardValues = {};
          let updatedCurrentValues = {};

          qids.forEach((qid, index) => {
            const driverKey = `driver-${fieldNameTmp}-${index}`;
            const absoluteKey = `absolute-${fieldNameTmp}-${index}`;
            const percentageKey = `percentage-${fieldNameTmp}-${index}`;

            let findValue = {};
            Object.entries(sv.allNewValues).forEach(([key, value]) => {
              const [field, case_commodity, id] = key.split("-");
              const updatedCurrentKey = `current-${case_commodity}-${id}`;
              if (id === "1" && field === "absolute") {
                // update new focus total income value
                updatedCurrentValues = {
                  ...updatedCurrentValues,
                  [updatedCurrentKey]: parseFloat(value),
                };
              }
              if (id === qid) {
                if (field === "absolute") {
                  updatedCurrentValues = {
                    ...updatedCurrentValues,
                    [updatedCurrentKey]: parseFloat(value),
                  };
                }
                // hanlde diversified value as "diversified"
                findValue = {
                  ...findValue,
                  driver: `${case_commodity}-${qid}`,
                  [field]: value,
                };
              }
            });
            backwardValues = {
              ...backwardValues,
              [driverKey]: findValue?.driver || null,
              [absoluteKey]: findValue?.absolute || null,
              [percentageKey]: findValue?.percentage || null,
            };
          });

          // handle backward for focus commodity
          // const focusCommodityPrimaryQuestionIds = [
          //   2, 3, 4, 40, 41, 42, 5, 26, 43, 7,
          // ];

          const updatedSegmentAnswers = isEmpty(segment?.answers)
            ? {}
            : {
                ...segment.answers,
                ...updatedCurrentValues,
              };
          updatedSegment = {
            ...segment,
            answers: { ...updatedSegmentAnswers },
          };

          updatedSegmentScenarioValue = [updatedSegment].map((segment) => {
            const answers = isEmpty(segment?.answers) ? {} : segment.answers;

            let diversifiedCaseCommodityId = "";
            const remappedAnswers = Object.keys(answers).map((key) => {
              const [fieldKey, caseCommodityId, questionId] = key.split("-");

              const commodity = currentCase.case_commodities.find(
                (cc) => cc.id === parseInt(caseCommodityId)
              );

              if (
                questionId === "diversified" &&
                commodity?.commodity_type === "diversified"
              ) {
                diversifiedCaseCommodityId = caseCommodityId;
              }

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
                questionId: isNaN(parseInt(questionId))
                  ? "diversified"
                  : parseInt(questionId), // handle custom conditon for backward diversified
                value: answers?.[key] || 0, // if not found set as 0 to calculated inside array reduce
                isTotalFeasibleFocusIncome:
                  totalCommodityValue &&
                  commodityFocus &&
                  fieldKey === "feasible"
                    ? true
                    : false,
                isTotalFeasibleDiversifiedIncome:
                  totalCommodityValue &&
                  !commodityFocus &&
                  fieldKey === "feasible"
                    ? true
                    : totalOtherDiversifiedIncome && fieldKey === "feasible"
                    ? true
                    : false,
                isTotalCurrentFocusIncome:
                  totalCommodityValue &&
                  commodityFocus &&
                  fieldKey === "current"
                    ? true
                    : false,
                isTotalCurrentDiversifiedIncome:
                  totalCommodityValue &&
                  !commodityFocus &&
                  fieldKey === "current"
                    ? true
                    : totalOtherDiversifiedIncome && fieldKey === "current"
                    ? true
                    : false,
                feasibleCost:
                  cost && answers[key] && fieldKey === "feasible"
                    ? true
                    : false,
                currentCost:
                  cost && answers[key] && fieldKey === "current" ? true : false,
                costName: cost ? cost.text : "",
              };
            });

            // handle custom backward for diversified
            const backwardTotalIncomeQuestions = [
              ...totalIncomeQuestions.filter((qs) => qs.includes("-1")),
              `${diversifiedCaseCommodityId}-diversified`,
            ];

            const totalCurrentIncomeAnswer = backwardTotalIncomeQuestions
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
              {
                default_value: customFormula.focus_commodity_cost_of_production,
              },
              "current",
              focusCommodityAnswers
            );
            const feasibleFocusCommodityCoP = getFunctionDefaultValue(
              {
                default_value: customFormula.focus_commodity_cost_of_production,
              },
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
              total_current_revenue_focus_commodity:
                currentRevenueFocusCommodity,
              total_feasible_revenue_focus_commodity:
                feasibleRevenueFocusCommodity,
              total_current_focus_commodity_cost_of_production:
                currentFocusCommodityCoP,
              total_feasible_focus_commodity_cost_of_production:
                feasibleFocusCommodityCoP,
              answers: remappedAnswers,
            };
          })[0];

          return {
            ...sv,
            allNewValues: backwardValues,
            currentSegmentValue: currentDashboardData,
            updatedSegment,
            updatedSegmentScenarioValue,
          };
        }
        return { ...sv, updatedSegment, updatedSegmentScenarioValue };
      }
    );
    const bacwardRes = {
      ...currentScenarioData,
      scenarioValues: orderBy(backwardScenarioValues, "segmentId"),
    };

    // update state value
    CaseVisualState.update((s) => ({
      ...s,
      scenarioModeling: {
        ...s.scenarioModeling,
        config: {
          ...s.scenarioModeling.config,
          scenarioData: s.scenarioModeling.config.scenarioData.map(
            (scenario) => {
              if (scenario.key === bacwardRes.key) {
                return {
                  ...scenario,
                  scenarioValues: orderBy(backwardScenarioValues, "segmentId"),
                };
              }
              return scenario;
            }
          ),
        },
      },
    }));
    // EOL Update scenario modeling global state

    setRefreshBackward(false);
    return bacwardRes;
  }, [
    currentScenarioData,
    segment,
    globalSectionTotalValues,
    costQuestions,
    currentCase.case_commodities,
    flattenedQuestionGroups,
    totalCommodityQuestions,
    totalIncomeQuestions,
    currentDashboardData,
    refreshBackward,
  ]);

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

  // recalculate drivers value by new value from scenario modeling form
  const recalculate = ({ key, updatedSegment }) => {
    const [fieldName, caseCommodityId, questionId] = key.split("-");

    // handle diversified aggregator
    if (questionId === "diversified") {
      updatedSegment["answers"] = {
        ...updatedSegment["answers"],
      };
    } else {
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
    }
  };

  const onScenarioModelingIncomeDriverFormValuesChange = (
    changedValue,
    allValues
  ) => {
    const allNewValues = { ...allValues };

    const valueKey = Object.keys(changedValue)[0];
    const [valueField, scenarioKey, segmentId, index] = valueKey.split("-");

    const variableFieldName = `${scenarioKey}-${segmentId}-${index}`;
    const absoluteField = `absolute-${variableFieldName}`;
    const percentageField = `percentage-${variableFieldName}`;

    let newFeasibleValue = 0;
    const newValue = changedValue[valueKey];

    const driverDropdownKey = Object.keys(allNewValues).find(
      (key) =>
        key === `driver-${variableFieldName}` &&
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

    // detect if driver contain diversified aggregator
    const diversifiedDriversValue = Object.entries(allNewValues || {}).find(
      ([key, value]) =>
        key?.includes("driver") && value?.includes("diversified")
    );
    const isDiversifiedAggregator =
      diversifiedDriversValue?.length > 0 || false;
    // handle custom backward for diversified
    let backwardTotalIncomeQuestions = totalIncomeQuestions;
    if (isDiversifiedAggregator) {
      backwardTotalIncomeQuestions = [
        ...totalIncomeQuestions.filter((qs) => qs.includes("-1")),
        diversifiedDriversValue?.[1] || "",
      ];
    }

    const segmentAnswerField = `current-${driverDropdownValue}`;
    let currentSegmentAnswer = segment.answers?.[segmentAnswerField];
    if (segmentAnswerField.includes("diversified")) {
      // handle diversified question key change
      const findSectionValue =
        globalSectionTotalValues.find((gs) => gs.segmentId === segment.id) ||
        {};
      currentSegmentAnswer =
        findSectionValue?.sectionTotalValues?.diversified?.current;
    }

    const currentScenarioValue = backwardScenarioData.scenarioValues.find(
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

      const totalCurrentIncomeAnswer = backwardTotalIncomeQuestions
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
                  ...(currentScenarioValue?.selectedDrivers
                    ? currentScenarioValue.selectedDrivers.filter(
                        (x) => x.field !== valueKey
                      )
                    : []),
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
              if (scenario.key === backwardScenarioData.key) {
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

  // recaltulate on load
  useEffect(() => {
    if (refreshBackward) {
      return;
    }
    const currentFormValues = scenarioDriversForm.getFieldsValue();
    Object.entries(currentFormValues).forEach(([key, value]) => {
      if (key && value) {
        onScenarioModelingIncomeDriverFormValuesChange(
          { [key]: value },
          currentFormValues
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshBackward]);

  const initialScenarioModelingIncomeDriverValues = useMemo(() => {
    if (backwardScenarioData?.scenarioValues?.length) {
      const values = backwardScenarioData.scenarioValues.find(
        (data) => data.segmentId === segment.id
      );
      return isEmpty(values) ? {} : values.allNewValues;
    }
    return {};
  }, [segment.id, backwardScenarioData.scenarioValues]);

  const scenarioTotalIncome = useMemo(() => {
    const findScenario =
      backwardScenarioData?.scenarioValues?.find(
        (s) => s.segmentId === segment.id
      ) || {};
    const newTotalIncome =
      findScenario?.updatedSegmentScenarioValue?.total_current_income || 0;
    // TODO :: delete this
    // const currentTotalIncome = currentDashboardData?.total_current_income || 0;
    // if (
    //   findScenario?.value &&
    //   Math.round(currentTotalIncome) === Math.round(newTotalIncome)
    // ) {
    //   return findScenario?.value || 0;
    // }
    // EOLTODO :: delete this
    return Math.round(newTotalIncome);
  }, [segment?.id, backwardScenarioData?.scenarioValues]);

  return (
    <Row
      align="middle"
      gutter={[24, 24]}
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
              name={`scenario-modeling-income-driver-form-${backwardScenarioData.key}-${segment.id}`}
              form={scenarioDriversForm}
              onValuesChange={onScenarioModelingIncomeDriverFormValuesChange}
              // initialValues={initialScenarioModelingIncomeDriverValues}
            >
              <Row gutter={[5, 5]} align="middle">
                <Col span={11}>Income Driver</Col>
                <Col span={5}>
                  {backwardScenarioData?.percentage ? "Change" : "New"}
                </Col>
                <Col span={4} align="end">
                  Current
                </Col>
                <Col span={4} align="end">
                  {backwardScenarioData?.percentage ? "New" : "Change"}
                </Col>
              </Row>
              {MAX_VARIABLES.map((index) => (
                <Question
                  key={`scenario-${backwardScenarioData.key}-${segment.id}-${index}`}
                  index={index}
                  segment={segment}
                  percentage={backwardScenarioData.percentage}
                  currentScenarioData={backwardScenarioData}
                  initialValues={initialScenarioModelingIncomeDriverValues}
                />
              ))}
            </Form>
            {/* TOTAL INCOME SECTION */}
            <div style={{ marginTop: 24, fontWeight: "bold" }}>
              <Row gutter={[10, 10]} align="middle">
                <Col span={16} align="end">
                  Total Income:
                </Col>
                <Col span={4} align="end">
                  {thousandFormatter(
                    currentDashboardData?.total_current_income || 0,
                    2
                  )}
                </Col>
                <Col span={4} align="end">
                  {thousandFormatter(scenarioTotalIncome, 2)}
                </Col>
              </Row>
            </div>
            {/* EOL TOTAL INCOME SECTION */}
          </Col>
        </Row>
      </Col>
      <Col span={12}>
        <ChartSegmentsIncomeGapScenarioModeling
          currentScenarioData={backwardScenarioData}
        />
      </Col>
    </Row>
  );
};

export default ScenarioModelingIncomeDriversAndChart;
