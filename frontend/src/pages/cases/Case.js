import React, { useState, useEffect, useMemo } from "react";
import { Spin, Tabs } from "antd";
import { CaseWrapper } from "./layout";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib";
import { CurrentCaseState, stepPath, CaseUIState } from "./store";
import {
  SetIncomeTarget,
  EnterIncomeData,
  UnderstandIncomeGap,
  AssessImpactMitigationStrategies,
  ClosingGap,
} from "./steps";
import "./steps/steps.scss";

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
          <EnterIncomeData />
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

const SegmentTabsWrapper = ({ children }) => {
  const currentCase = CurrentCaseState.useState((s) => s);

  const segmentTabItems = useMemo(() => {
    return currentCase.segments.map((segment) => ({
      label: segment.name,
      key: segment.id,
      children: React.cloneElement(children, { segment }),
    }));
  }, [currentCase, children]);

  return (
    <div id="step1">
      <Tabs
        className="step-segment-tabs-container"
        type="card"
        items={segmentTabItems}
        tabBarGutter={5}
      />
    </div>
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

  useEffect(() => {
    if (caseId && currentCase.id !== caseId) {
      setLoading(true);
      // prevent fetch the data when it's already defined
      api
        .get(`case/${caseId}`)
        .then((res) => {
          const { data } = res;
          CurrentCaseState.update((s) => ({ ...s, ...data }));
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
      {loading ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        renderPage(step, navigate)
      )}
    </CaseWrapper>
  );
};

export default Case;
