import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import {
  SideMenu,
  CaseProfile,
  IncomeDriverDataEntry,
  IncomeDriverDashboard,
  getFunctionDefaultValue,
  customFormula,
} from "./components";
import { Row, Col, Spin, Card, Alert } from "antd";
import "./cases.scss";
import { api, flatten } from "../../lib";
import { CaseTitleIcon } from "../../lib/icon";
import dayjs from "dayjs";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import { UserState } from "../../store";
import { adminRole } from "../../store/static";

const pageDependencies = {
  "Income Driver Data Entry": ["Case Profile"],
  "Income Driver Dashboard": ["Case Profile", "Income Driver Data Entry"],
};

const commodityOrder = ["focus", "secondary", "tertiary", "diversified"];

const defaultSegmentFormValues = {
  key: "1",
  label: "Segment 1",
  currentSegmentId: null,
  answers: {},
};

const masterCommodityCategories = window.master?.commodity_categories || [];
const commodityNames = masterCommodityCategories.reduce((acc, curr) => {
  const commodities = curr.commodities.reduce((a, c) => {
    return { ...a, [c.id]: c.name };
  }, {});
  return { ...acc, ...commodities };
}, {});

const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const Case = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseTitle, setCaseTitle] = useState("New Case");
  const [caseDescription, setCaseDescription] = useState(null);
  const [page, setPage] = useState("Case Profile");
  const [formData, setFormData] = useState({});
  const [finished, setFinished] = useState([]);
  const [commodityList, setCommodityList] = useState([]);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialOtherCommodityTypes, setInitialCommodityTypes] = useState([]);
  const [currentCase, setCurrentCase] = useState({});
  const [segmentFormValues, setSegmentFormValues] = useState([
    defaultSegmentFormValues,
  ]);
  const showCaseTitle = false; // don't show title for now

  const {
    role: userRole,
    internal_user: userInternal,
    case_access: userCaseAccess,
  } = UserState.useState((s) => s);

  const enableEditCase = useMemo(() => {
    const caseIdParam = caseId ? caseId : currentCaseId;
    if (adminRole.includes(userRole)) {
      return true;
    }
    // check user access
    const userPermission = userCaseAccess.find(
      (a) => a.case === parseInt(caseIdParam)
    )?.permission;
    if ((userInternal && !userPermission) || userPermission === "view") {
      return false;
    }
    if (userPermission === "edit") {
      return true;
    }
    return false;
  }, [caseId, currentCaseId, userRole, userCaseAccess, userInternal]);

  useEffect(() => {
    const check = segmentFormValues.filter((x) => x.currentSegmentId);
    if (caseId && check.length) {
      setFinished(["Case Profile", "Income Driver Data Entry"]);
    }
  }, [segmentFormValues, caseId]);

  const totalIncomeQuestion = useMemo(() => {
    const qs = questionGroups.map((group) => {
      const questions = flatten(group.questions).filter((q) => !q.parent);
      const commodity = commodityList.find(
        (c) => c.commodity === group.commodity_id
      );
      return questions.map((q) => `${commodity.case_commodity}-${q.id}`);
    });
    return qs.flatMap((q) => q);
  }, [questionGroups, commodityList]);

  const costQuestions = useMemo(() => {
    const qs = questionGroups.map((group) => {
      const questions = flatten(group.questions).filter((q) =>
        q.text.toLowerCase().includes("cost")
      );
      return questions;
    });
    return qs.flatMap((q) => q);
  }, [questionGroups]);

  const flattenedQuestionGroups = useMemo(() => {
    const qg = questionGroups.map((group) => flatten(group.questions));
    return qg.flatMap((q) => q);
  }, [questionGroups]);

  const dashboardData = useMemo(() => {
    const check = segmentFormValues.filter((x) => x.currentSegmentId);
    if (!check.length || !questionGroups.length) {
      return [];
    }
    const formValuesWithTotalCurrentIncomeAnswer = segmentFormValues.map(
      (currentFormValue) => {
        const totalCurrentIncomeAnswer = totalIncomeQuestion
          .map((qs) => currentFormValue?.answers[`current-${qs}`])
          .filter((a) => a)
          .reduce((acc, a) => acc + a, 0);
        const totalFeasibleIncomeAnswer = totalIncomeQuestion
          .map((qs) => currentFormValue?.answers[`feasible-${qs}`])
          .filter((a) => a)
          .reduce((acc, a) => acc + a, 0);
        return {
          ...currentFormValue,
          total_current_income: totalCurrentIncomeAnswer,
          total_feasible_income: totalFeasibleIncomeAnswer,
        };
      }
    );
    const mappedData = formValuesWithTotalCurrentIncomeAnswer.map((d) => {
      const answers = Object.keys(d.answers).map((k) => {
        const [dataType, caseCommodityId, questionId] = k.split("-");
        const commodity = commodityList.find(
          (x) => x.case_commodity === parseInt(caseCommodityId)
        );
        const commodityId = commodity.commodity;
        const commodityFocus =
          commodity.commodity_type === "focus" ? true : false;
        const totalCommodityQuestion = questionGroups
          .map((group) => {
            const questions = flatten(group.questions).filter(
              (q) => !q.parent && q.question_type === "aggregator"
            );
            return questions;
          })
          .flatMap((q) => q);

        const totalCommodityValue = totalCommodityQuestion.find(
          (q) => q.id === parseInt(questionId)
        );
        const cost = costQuestions.find(
          (q) => q.id === parseInt(questionId) && q.parent === 1
        );
        const question = flattenedQuestionGroups.find(
          (q) => q.id === parseInt(questionId)
        );
        const totalOtherDiversifiedIncome =
          question.question_type === "diversified" && !question.parent;
        return {
          name: dataType,
          question: question,
          commodityFocus: commodityFocus,
          commodityType: commodity.commodity_type,
          caseCommodityId: parseInt(caseCommodityId),
          commodityId: parseInt(commodityId),
          commodityName: commodityNames[commodityId],
          questionId: parseInt(questionId),
          value: d.answers[k],
          isTotalFeasibleFocusIncome:
            totalCommodityValue && commodityFocus && dataType === "feasible"
              ? true
              : false,
          isTotalFeasibleDiversifiedIncome:
            totalCommodityValue && !commodityFocus && dataType === "feasible"
              ? true
              : totalOtherDiversifiedIncome && dataType === "feasible"
              ? true
              : false,
          isTotalCurrentFocusIncome:
            totalCommodityValue && commodityFocus && dataType === "current"
              ? true
              : false,
          isTotalCurrentDiversifiedIncome:
            totalCommodityValue && !commodityFocus && dataType === "current"
              ? true
              : totalOtherDiversifiedIncome && dataType === "current"
              ? true
              : false,
          feasibleCost:
            cost && d.answers[k] && dataType === "feasible" ? true : false,
          currentCost:
            cost && d.answers[k] && dataType === "current" ? true : false,
          costName: cost ? cost.text : "",
        };
      });
      const totalCostFeasible = answers
        .filter((a) => a.feasibleCost)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalCostCurrent = answers
        .filter((a) => a.currentCost)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalFeasibleFocusIncome = answers
        .filter((a) => a.isTotalFeasibleFocusIncome)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalFeasibleDiversifiedIncome = answers
        .filter((a) => a.isTotalFeasibleDiversifiedIncome)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalCurrentFocusIncome = answers
        .filter((a) => a.isTotalCurrentFocusIncome)
        .reduce((acc, curr) => acc + curr.value, 0);
      const totalCurrentDiversifiedIncome = answers
        .filter((a) => a.isTotalCurrentDiversifiedIncome)
        .reduce((acc, curr) => acc + curr.value, 0);

      const focusCommodityAnswers = answers
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
        ...d,
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
        answers: answers,
      };
    });
    return orderBy(mappedData, ["id", "key"]);
  }, [
    commodityList,
    costQuestions,
    questionGroups,
    flattenedQuestionGroups,
    segmentFormValues,
    totalIncomeQuestion,
  ]);

  useEffect(() => {
    if (caseId && isEmpty(formData) && !loading) {
      setCurrentCaseId(caseId);
      setLoading(true);
      api
        .get(`case/${caseId}`)
        .then((res) => {
          // load case data
          const { data } = res;
          setCurrentCase(data);
          setFinished(["Case Profile"]);
          setCaseTitle(data.name);
          setCaseDescription(data.description);
          // set other commodities type
          setInitialCommodityTypes(
            data.case_commodities.map((x) => x.commodity_type)
          );
          // set commodity list and order by id to match
          // focus, secondary, tertiary, diversified order
          const commodities = commodityOrder
            .map((co) => {
              const temp = data.case_commodities.find(
                (d) => d.commodity_type === co
              );
              if (!temp) {
                return false;
              }
              return {
                ...temp,
                currency: data.currency,
                case_commodity: temp.id,
              };
            })
            .filter((x) => x);
          setCommodityList(commodities);
          // focus commodity
          const focusCommodityValue = {
            name: data.name,
            description: data.description,
            private: data?.private || false,
            tags: data?.tags || [],
            country: data.country,
            focus_commodity: data.focus_commodity,
            year: dayjs(String(data.year)),
            currency: data.currency,
            area_size_unit: data.area_size_unit,
            volume_measurement_unit: data.volume_measurement_unit,
            reporting_period: data.reporting_period,
          };
          // secondary
          let secondaryCommodityValue = {};
          const secondaryCommodityTmp = data.case_commodities.find(
            (val) => val.commodity_type === "secondary"
          );
          if (secondaryCommodityTmp) {
            Object.keys(secondaryCommodityTmp).forEach((key) => {
              let val = secondaryCommodityTmp[key];
              if (key === "breakdown") {
                val = val ? 1 : 0;
              }
              secondaryCommodityValue = {
                ...secondaryCommodityValue,
                [`1-${key}`]: val,
              };
            });
          }
          // tertiary
          let tertiaryCommodityValue = {};
          const tertiaryCommodityTmp = data.case_commodities.find(
            (val) => val.commodity_type === "tertiary"
          );
          if (tertiaryCommodityTmp) {
            Object.keys(tertiaryCommodityTmp).forEach((key) => {
              let val = tertiaryCommodityTmp[key];
              if (key === "breakdown") {
                val = val ? 1 : 0;
              }
              tertiaryCommodityValue = {
                ...tertiaryCommodityValue,
                [`2-${key}`]: val,
              };
            });
          }
          // set initial value
          setFormData({
            ...focusCommodityValue,
            ...secondaryCommodityValue,
            ...tertiaryCommodityValue,
          });
          // set segment initial value
          const segmentFormValuesTmp = orderBy(data.segments, "id").map(
            (it, itIndex) => ({
              ...it,
              key: String(itIndex + 1),
              label: it.name,
              currentSegmentId: it.id,
              answers: it.answers,
            })
          );
          setSegmentFormValues(orderBy(segmentFormValuesTmp, ["id", "key"]));
          // fetch questions
          api
            .get(`/questions/${caseId}`)
            .then((res) => {
              // reorder question to match commodity list order (CORRECT ORDER)
              const dataTmp = commodities.map((cl) =>
                res.data.find((d) => d.commodity_id === cl.commodity)
              );
              setQuestionGroups(dataTmp);
            })
            .finally(() => {
              setTimeout(() => {
                setLoading(false);
              }, 200);
            });
        })
        .catch((e) => {
          console.error("Error fetching case profile data", e);
          navigate("/not-found");
          setSegmentFormValues([defaultSegmentFormValues]);
          setLoading(false);
        });
    }
  }, [caseId, formData, loading, navigate]);

  const setActive = (selected) => {
    if (finished.includes(selected)) {
      setPage(selected);
    } else {
      const dependencies = pageDependencies[selected];
      if (dependencies) {
        if (dependencies.every((dependency) => finished.includes(dependency))) {
          setPage(selected);
        }
      }
    }
  };

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Cases", href: "/cases" },
        { title: caseTitle },
      ]}
      breadcrumbRightContent={
        currentCase.updated_by
          ? `Last update by ${currentCase?.updated_by} ${
              currentCase?.updated_at
                ? `on ${new Date(currentCase?.updated_at).toLocaleString(
                    "en-US",
                    options
                  )}`
                : ""
            }`
          : null
      }
      wrapperId="case"
    >
      {loading ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        <Row gutter={[16, 16]} className="case-content">
          <SideMenu active={page} setActive={setActive} finished={finished} />
          {/* Banner for Viewer */}
          {!enableEditCase && (
            <Col span={24} style={{ paddingTop: 5 }}>
              <Alert
                type="warning"
                message="You are a viewer for this cases. You are able to view the data to encourage cross-learning and consultation . Please contact the case owner before downloading any data from the case."
              />
            </Col>
          )}
          {/* EOL Banner for Viewer */}
          {showCaseTitle && (
            <Col span={24}>
              <Card className="case-title-wrapper" id="case-title">
                <h2>{caseTitle}</h2>
                {caseDescription ? <p>{caseDescription}</p> : null}
                <div className="case-title-icon">
                  <CaseTitleIcon height={110} />
                </div>
              </Card>
            </Col>
          )}
          <Col span={24}>
            {page === "Case Profile" && (
              <CaseProfile
                setCaseTitle={setCaseTitle}
                setCaseDescription={setCaseDescription}
                formData={formData}
                setFormData={setFormData}
                finished={finished}
                setFinished={setFinished}
                setPage={setPage}
                commodityList={commodityList}
                setCommodityList={setCommodityList}
                currentCaseId={currentCaseId}
                setCurrentCaseId={setCurrentCaseId}
                initialOtherCommodityTypes={initialOtherCommodityTypes}
                setCurrentCase={setCurrentCase}
                currentCase={currentCase}
                enableEditCase={enableEditCase}
              />
            )}
            {page === "Income Driver Data Entry" && (
              <IncomeDriverDataEntry
                commodityList={commodityList}
                currentCaseId={currentCaseId}
                currentCase={currentCase}
                // setCaseData={setCaseData}
                totalIncomeQuestion={totalIncomeQuestion}
                questionGroups={questionGroups}
                setQuestionGroups={setQuestionGroups}
                dashboardData={dashboardData}
                finished={finished}
                setFinished={setFinished}
                segmentFormValues={segmentFormValues}
                setSegmentFormValues={setSegmentFormValues}
                setPage={setPage}
                enableEditCase={enableEditCase}
              />
            )}
            {page === "Income Driver Dashboard" && (
              <IncomeDriverDashboard
                questionGroups={questionGroups}
                commodityList={commodityList}
                currentCaseId={currentCaseId}
                currentCase={currentCase}
                dashboardData={dashboardData}
                setPage={setPage}
                enableEditCase={enableEditCase}
              />
            )}
          </Col>
        </Row>
      )}
    </ContentLayout>
  );
};

export default Case;
