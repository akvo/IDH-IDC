import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import { CaseWrapper } from "./layout";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib";
import { CurrentCaseState, stepPath } from "./store";
import {
  SetIncomeTarget,
  EnterIncomeData,
  UnderstandIncomeGap,
  AssessImpactMitigationStrategies,
  ClosingGap,
} from "./steps";

const Case = () => {
  const navigate = useNavigate();
  const { caseId, step } = useParams();

  const [loading, setLoading] = useState(false);
  const currentCase = CurrentCaseState.useState((s) => s);

  const page = (key) => {
    switch (key) {
      case stepPath.step1.label:
        return <SetIncomeTarget />;
      case stepPath.step2.label:
        return <EnterIncomeData />;
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

  useEffect(() => {
    if (caseId && !currentCase.id) {
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
  }, [caseId, currentCase, navigate]);

  return (
    <CaseWrapper caseId={caseId} step={step} currentCase={currentCase}>
      {loading ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        page(step)
      )}
    </CaseWrapper>
  );
};

export default Case;
