import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { api } from "../../../lib";

const commodityOrder = ["focus", "secondary", "tertiary", "diversified"];

/**
 * STEP 2
 */
const EnterIncomeData = ({ segment, setbackfunction, setnextfunction }) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const [questionGroups, setQuestionGroups] = useState([]);

  const backFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step1.label}`);
  }, [navigate, currentCase.id]);

  const nextFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step3.label}`);
  }, [navigate, currentCase.id]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
  }, [setbackfunction, setnextfunction, backFunction, nextFunction]);

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
        const dataTmp = reorderedCaseCommodities
          .map((cc) => data.find((d) => d.commodity_id === cc.commodity))
          .filter((x) => x);
        setQuestionGroups(dataTmp);
      });
    }
  }, [currentCase.id, currentCase.case_commodities]);
  console.log(questionGroups);

  return <div>EnterIncomeData {segment.name}</div>;
};

export default EnterIncomeData;
