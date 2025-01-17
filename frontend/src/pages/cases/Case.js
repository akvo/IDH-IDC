import React, { useState, useEffect, useMemo } from "react";
import { Spin, Tabs, Row, Col } from "antd";
import { CaseWrapper } from "./layout";
import { useParams, useNavigate } from "react-router-dom";
import { api, flatten } from "../../lib";
import {
  CurrentCaseState,
  stepPath,
  CaseUIState,
  PrevCaseState,
  CaseVisualState,
} from "./store";
import {
  SetIncomeTarget,
  EnterIncomeData,
  UnderstandIncomeGap,
  AssessImpactMitigationStrategies,
  ClosingGap,
} from "./steps";
import { EnterIncomeDataVisual } from "./visualizations";
import "./steps/steps.scss";
import { isEmpty } from "lodash";

const commodityOrder = ["focus", "secondary", "tertiary", "diversified"];

const Loading = () => (
  <div className="loading-container">
    <Spin />
  </div>
);

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
        <SegmentTabsWrapper>
          <SetIncomeTarget />
        </SegmentTabsWrapper>
      );
    case stepPath.step2.label:
      return (
        <SegmentTabsWrapper>
          <EnterIncomeData key="left" />
          <EnterIncomeDataVisual key="right" />
        </SegmentTabsWrapper>
      );
    case stepPath.step3.label:
      return <UnderstandIncomeGap />;
    case stepPath.step4.label:
      return <AssessImpactMitigationStrategies />;
    case stepPath.step5.label:
      return (
        <SegmentTabsWrapper>
          <ClosingGap />
        </SegmentTabsWrapper>
      );
    default:
      return navigate("/not-found");
  }
};

const SegmentTabsWrapper = ({ children, setbackfunction, setnextfunction }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { activeSegmentId } = CaseUIState.useState((s) => s.general);
  const childrenCount = React.Children.count(children);

  // set default active segmentId
  useEffect(() => {
    if (!activeSegmentId && !isEmpty(currentCase.segments)) {
      CaseUIState.update((s) => ({
        ...s,
        general: {
          ...s.general,
          activeSegmentId: currentCase.segments?.[0]?.id || null,
        },
      }));
    }
  }, [activeSegmentId, currentCase.segments]);

  const segmentTabItems = useMemo(() => {
    return currentCase.segments.map((segment) => ({
      label: segment.name,
      key: segment.id,
      children:
        childrenCount === 1
          ? React.Children.map(children, (child) =>
              React.isValidElement(child)
                ? React.cloneElement(child, {
                    segment,
                    setbackfunction,
                    setnextfunction,
                  })
                : null
            )
          : React.Children.map(children, (child) =>
              child.key === "left"
                ? React.isValidElement(child)
                  ? React.cloneElement(child, {
                      segment,
                      setbackfunction,
                      setnextfunction,
                    })
                  : null
                : null
            ),
    }));
  }, [currentCase, children, setbackfunction, setnextfunction, childrenCount]);

  return (
    <Row id="steps" gutter={[20, 20]}>
      <Col span={childrenCount === 1 ? 24 : 16}>
        <Tabs
          className="step-segment-tabs-container"
          type="card"
          items={segmentTabItems}
          tabBarGutter={5}
          activeKey={activeSegmentId || currentCase?.segments?.[0]?.id || null}
          onChange={(val) => {
            CaseUIState.update((s) => ({
              ...s,
              general: {
                ...s.general,
                activeSegmentId: val,
              },
            }));
          }}
        />
      </Col>
      {childrenCount > 1 &&
        React.Children.map(children, (child, index) =>
          child.key === "right" ? (
            React.isValidElement(child) ? (
              <Col key={index} span={8}>
                {child}
              </Col>
            ) : null
          ) : null
        )}
    </Row>
  );
};

const Case = () => {
  const navigate = useNavigate();
  const { caseId, step } = useParams();

  const [loading, setLoading] = useState(false);
  const currentCase = CurrentCaseState.useState((s) => s);

  const updateStepIncomeTargetState = (key, value) => {
    CaseUIState.update((s) => {
      s.stepSetIncomeTarget = {
        ...s.stepSetIncomeTarget,
        [key]: value,
      };
    });
  };

  // Fetch case details
  useEffect(() => {
    if (caseId && currentCase.id !== parseInt(caseId)) {
      setLoading(true);
      // prevent fetch the data when it's already defined
      api
        .get(`case/${caseId}`)
        .then((res) => {
          const { data } = res;
          CurrentCaseState.update((s) => ({ ...s, ...data }));
          PrevCaseState.update((s) => ({ ...s, ...data }));
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

  useEffect(() => {
    // fetch region data
    if (currentCase?.country) {
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
        })
        .finally(() => {
          updateStepIncomeTargetState("regionOptionLoading", false);
        });
    }
  }, [currentCase?.country]);

  return (
    <CaseWrapper caseId={caseId} step={step} currentCase={currentCase}>
      {loading ? <Loading /> : renderPage(step, navigate)}
    </CaseWrapper>
  );
};

export default Case;
