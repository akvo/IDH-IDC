import React from "react";
import { CaseWrapper } from "./layout";
import { useParams } from "react-router-dom";

const Case = () => {
  const { caseId, stepId } = useParams();

  return <CaseWrapper stepId={stepId}>Case</CaseWrapper>;
};

export default Case;
