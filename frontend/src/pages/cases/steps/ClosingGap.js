import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";

/**
 * STEP 5
 */
const ClosingGap = ({ setbackfunction, setnextfunction }) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);

  const backFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step4.label}`);
  }, [navigate, currentCase.id]);

  const nextFunction = useCallback(() => {
    console.info("Finish");
  }, []);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
  }, [setbackfunction, setnextfunction, backFunction, nextFunction]);

  return <div>ClosingGap</div>;
};

export default ClosingGap;
