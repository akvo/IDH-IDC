import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import { CaseWrapper } from "./layout";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib";
import { CurrentCaseState } from "./store";

const Case = () => {
  const navigate = useNavigate();
  const { caseId, stepId } = useParams();

  const [loading, setLoading] = useState(true);
  const currentCase = CurrentCaseState.useState((s) => s);

  const page = (key) => {
    switch (parseInt(key)) {
      case 1:
        return <div>Step 1 {currentCase.name}</div>;
      case 2:
        return <>Step 2</>;
      case 3:
        return <>Step 3</>;
      case 4:
        return <>Step 4</>;
      case 5:
        return <>Step 5</>;
      default:
        return navigate("/not-found");
    }
  };

  useEffect(() => {
    if (caseId && !currentCase.id) {
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
    <CaseWrapper caseId={caseId} stepId={stepId} currentCase={currentCase}>
      {loading ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        page(stepId)
      )}
    </CaseWrapper>
  );
};

export default Case;
