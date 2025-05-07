import React, { useState, useEffect } from "react";
import { CaseWrapper, SegmentTabsWrapper } from "./layout";
import { useParams, useNavigate } from "react-router-dom";
import { api, flatten, getFunctionDefaultValue } from "../../lib";
import {
  CurrentCaseState,
  stepPath,
  CaseUIState,
  PrevCaseState,
  CaseVisualState,
} from "./store";
import { UserState } from "../../store";
import {
  SetIncomeTarget,
  EnterIncomeData,
  UnderstandIncomeGap,
  AssessImpactMitigationStrategies,
  ClosingGap,
} from "./steps";
import { EnterIncomeDataVisual } from "./visualizations";
import "./steps/steps.scss";
import { isEmpty, orderBy } from "lodash";
import { customFormula } from "../../lib/formula";
import { adminRole } from "../../store/static";
import { Space, Row, Col } from "antd";

const commodityOrder = ["focus", "secondary", "tertiary", "diversified"];
const masterCommodityCategories = window.master?.commodity_categories || [];
const commodityNames = masterCommodityCategories.reduce((acc, curr) => {
  const commodities = curr.commodities.reduce((a, c) => {
    return { ...a, [c.id]: c.name };
  }, {});
  return { ...acc, ...commodities };
}, {});

const addLevelIntoQuestions = ({ questions, level = 0 }) => {
  return questions.map((q) => {
    if (q.childrens.length) {
      q["childrens"] = addLevelIntoQuestions({
        questions: q.childrens,
        level: level + 1,
      });
    }
    if (!q.parent) {
      return {
        ...q,
        level: 0,
      };
    }
    return {
      ...q,
      level: level,
    };
  });
};

const renderPage = (key, navigate) => {
  switch (key) {
    case stepPath.step1.label:
      return (
        <Row id="set-income-target" gutter={[24, 24]}>
          <Col span={24} className="header-wrapper">
            <Space direction="vertical">
              <div className="title">Set Income Target</div>
            </Space>
          </Col>
          <Col span={24}>
            <SegmentTabsWrapper>
              <SetIncomeTarget />
            </SegmentTabsWrapper>
          </Col>
        </Row>
      );
    case stepPath.step2.label:
      return (
        <Row id="enter-income-data" gutter={[24, 24]}>
          <Col span={24} className="header-wrapper">
            <Space direction="vertical">
              <div className="title">Enter Income Data</div>
            </Space>
          </Col>
          <Col span={24}>
            <SegmentTabsWrapper>
              <EnterIncomeData key="left" />
              <EnterIncomeDataVisual key="right" />
            </SegmentTabsWrapper>
          </Col>
        </Row>
      );
    case stepPath.step3.label:
      return <UnderstandIncomeGap />;
    case stepPath.step4.label:
      return <AssessImpactMitigationStrategies />;
    case stepPath.step5.label:
      return <ClosingGap />;
    default:
      return navigate("/not-found");
  }
};

const Case = () => {
  const navigate = useNavigate();
  const { caseId, step } = useParams();

  const [loading, setLoading] = useState(true);
  const currentCase = CurrentCaseState.useState((s) => s);
  const prevCase = PrevCaseState.useState((s) => s);
  const { questionGroups, totalIncomeQuestions } = CaseVisualState.useState(
    (s) => s
  );
  const userState = UserState.useState((s) => s);

  const updateStepIncomeTargetState = (key, value) => {
    CaseUIState.update((s) => {
      s.stepSetIncomeTarget = {
        ...s.stepSetIncomeTarget,
        [key]: value,
      };
    });
  };

  // check for enableEditCase
  useEffect(() => {
    const checkEnableEditCase = () => {
      if (adminRole.includes(userState?.role)) {
        return true;
      }
      // allow internal user to create new case
      if (userState?.internal_user && !caseId) {
        return true;
      }
      // check user access
      const userPermission = userState.case_access.find(
        (a) => a.case === parseInt(caseId)
      )?.permission;
      // allow internal user case owner to edit case
      if (
        userState?.internal_user &&
        currentCase?.created_by === userState?.email
      ) {
        return true;
      }
      if (
        (userState?.internal_user && !userPermission) ||
        userPermission === "view"
      ) {
        return false;
      }
      if (userPermission === "edit") {
        return true;
      }
      // handle external user in same company with case
      if (userState?.company === currentCase?.company && !userPermission) {
        return false;
      }
      return false;
    };

    CaseUIState.update((s) => ({
      ...s,
      general: {
        ...s.general,
        enableEditCase: checkEnableEditCase(),
      },
    }));
  }, [
    caseId,
    userState?.internal_user,
    userState?.email,
    userState?.case_access,
    userState?.role,
    userState?.company,
    currentCase?.created_by,
    currentCase?.company,
  ]);

  // Fetch case details
  useEffect(() => {
    if (caseId && currentCase.id !== parseInt(caseId)) {
      // setLoading(true);
      // prevent fetch the data when it's already defined
      api
        .get(`case/${caseId}`)
        .then((res) => {
          const { data } = res;
          if (data?.segments?.length) {
            // order the segments by it's ID
            data["segments"] = orderBy(data.segments, ["id"]);
          }
          CurrentCaseState.update((s) => ({ ...s, ...data }));
          PrevCaseState.update((s) => ({ ...s, ...data }));
          // set default active segmentId
          CaseUIState.update((s) => ({
            ...s,
            general: {
              ...s.general,
              activeSegmentId: orderBy(data.segments, ["id"])?.[0]?.id || null,
            },
          }));
        })
        .catch((e) => {
          console.error("Error fetching case data", e);
          navigate("/not-found");
        })
        .finally(() => {
          setTimeout(() => {
            setLoading(false);
          }, 100);
        });
    } else {
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  }, [caseId, currentCase.id, navigate]);

  // Fetch questions for income data entry
  useEffect(() => {
    if (currentCase?.id && currentCase?.case_commodities?.length) {
      const reorderedCaseCommodities = commodityOrder
        .map((co) => {
          const findCommodity = currentCase.case_commodities.find(
            (cc) => cc.commodity_type === co
          );
          return findCommodity;
        })
        .filter((x) => x);

      api.get(`/questions/${currentCase.id}`).then((res) => {
        const { data } = res;
        const incomeDataDriversTmp = [];
        const diversifiedGroupTmp = [];
        // regroup the questions to follow new design format
        const questionGroupsTmp = reorderedCaseCommodities.map((cc) => {
          const tmp = data.find((d) => d.commodity_id === cc.commodity);
          tmp["currency"] = currentCase.currency;
          tmp["questions"] = addLevelIntoQuestions({
            questions: tmp.questions,
          });
          if (cc.commodity_type === "focus") {
            incomeDataDriversTmp.push({
              type: "primary",
              groupName: "Primary Commodity",
              questionGroups: [{ ...cc, ...tmp }],
            });
          } else {
            diversifiedGroupTmp.push({ ...cc, ...tmp });
          }
          return { ...cc, ...tmp };
        });
        // add diversified group
        incomeDataDriversTmp.push({
          type: "diversified",
          groupName: "Diversified Income",
          questionGroups: diversifiedGroupTmp,
        });
        // eol

        // get totalIncomeQuestion
        const qs = questionGroupsTmp.flatMap((group) => {
          if (!group) {
            return [];
          }
          const questions = flatten(group.questions).filter((q) => !q.parent);
          // group id is case commodity id
          return questions.map((q) => `${group.id}-${q.id}`);
        });
        CaseVisualState.update((s) => ({
          ...s,
          questionGroups: questionGroupsTmp,
          totalIncomeQuestions: qs,
          incomeDataDrivers: incomeDataDriversTmp,
        }));
        // eol
      });
    }
  }, [currentCase.id, currentCase.case_commodities, currentCase.currency]);

  // fetch region data
  useEffect(() => {
    if (currentCase?.country) {
      if (currentCase?.country !== prevCase?.country) {
        // reset segments region, target, and benchmark if country changed
        CurrentCaseState.update((s) => ({
          ...s,
          segments: s.segments.map((segment) => ({
            ...segment,
            region: null,
            target: null,
            adult: null,
            child: null,
            benchmark: null,
          })),
        }));
        // EOL reset segments region, target, and benchmark
      }
      updateStepIncomeTargetState("regionOptionLoading", true);
      api
        .get(`region/options?country_id=${currentCase.country}`)
        .then((res) => {
          updateStepIncomeTargetState("regionOptionStatus", 200);
          updateStepIncomeTargetState("regionOptions", res.data);
        })
        .catch((e) => {
          const { status } = e.response;
          updateStepIncomeTargetState("regionOptionStatus", status);
          updateStepIncomeTargetState("regionOptions", []);
        })
        .finally(() => {
          updateStepIncomeTargetState("regionOptionLoading", false);
        });
    }
  }, [currentCase?.country, prevCase?.country]);

  // generate dashboard data
  useEffect(() => {
    if (!isEmpty(currentCase?.segments) && !isEmpty(questionGroups)) {
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
      const mappedData = currentCase.segments.map((segment) => {
        const answers = isEmpty(segment?.answers) ? {} : segment.answers;
        const remappedAnswers = Object.keys(answers).map((key) => {
          const [fieldKey, caseCommodityId, questionId] = key.split("-");
          const commodity = currentCase.case_commodities.find(
            (cc) => cc.id === parseInt(caseCommodityId)
          );
          const commodityFocus = commodity.commodity_type === "focus";
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
            commodityType: commodity.commodity_type,
            caseCommodityId: parseInt(caseCommodityId),
            commodityId: commodity.commodity,
            commodityName: commodityNames[commodity.commodity],
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
      CaseVisualState.update((s) => ({
        ...s,
        dashboardData: orderBy(mappedData, ["id"]),
      }));
    }
  }, [
    currentCase.segments,
    currentCase.case_commodities,
    questionGroups,
    totalIncomeQuestions,
  ]);

  // Fetch visualizaton config for sensitivity analysis and scenario modeling page
  useEffect(() => {
    if (currentCase.id) {
      api.get(`visualization/case/${currentCase.id}`).then((res) => {
        const { data } = res;
        // Sensitivity analysis
        const sensitivityAnalysisTmp = data.find(
          (v) => v.tab === "sensitivity_analysis"
        );
        if (!isEmpty(sensitivityAnalysisTmp)) {
          CaseVisualState.update((s) => ({
            ...s,
            sensitivityAnalysis: {
              ...s.sensitivityAnalysis,
              ...sensitivityAnalysisTmp,
            },
            prevSensitivityAnalysis: {
              ...s.prevSensitivityAnalysis,
              ...sensitivityAnalysisTmp,
            },
          }));
        }
        // Scenario modeling
        const scenarioModelingTmp = data.find(
          (v) => v.tab === "scenario_modeling"
        );
        if (!isEmpty(scenarioModelingTmp)) {
          CaseVisualState.update((s) => ({
            ...s,
            scenarioModeling: {
              ...s.scenarioModeling,
              ...scenarioModelingTmp,
              config: {
                ...scenarioModelingTmp.config,
                scenarioData: scenarioModelingTmp.config.scenarioData.map(
                  (x) => ({
                    ...x,
                    percentage:
                      typeof x?.percentage !== "undefined"
                        ? x.percentage
                        : scenarioModelingTmp.config.percentage,
                  })
                ),
              },
            },
            prevScenarioModeling: {
              ...s.prevScenarioModeling,
              ...scenarioModelingTmp,
              config: {
                ...scenarioModelingTmp.config,
                scenarioData: scenarioModelingTmp.config.scenarioData.map(
                  (x) => ({
                    ...x,
                    percentage:
                      typeof x?.percentage !== "undefined"
                        ? x.percentage
                        : scenarioModelingTmp.config.percentage,
                  })
                ),
              },
            },
          }));
        }
      });
    }
  }, [currentCase.id]);

  return (
    <CaseWrapper
      caseId={caseId}
      step={step}
      currentCase={currentCase}
      loading={loading}
    >
      {renderPage(step, navigate)}
    </CaseWrapper>
  );
};

export default Case;
