import React from "react";
import { Image, Steps } from "antd";
import "./landingcomp.scss";
import GetStartedImg from "../../../assets/images/get-started.png";
import { caseStepItems } from "../../../store/static";

const GetStarted = () => {
  return (
    <div id="get-started">
      <h2>What is the current income of the farmers and their income gap?</h2>
      <p>
        The Income Driver Calculator provides a structured approach by first
        calculating the living income gap for each farmer segment, based on
        current household income data. It then uses sensitivity analysis to
        identify the most influential income drivers and the specific value
        ranges these drivers would need to reach to bridge the gap.
        <br />
        <br />
        The tool also analyses the impact of diversified income sources on
        household income and allows users to model different intervention
        scenarios to assess their effectiveness in closing the income gap.
      </p>
      <div className="image-steps-container">
        <div className="image-wrapper">
          <Image src={GetStartedImg} preview={false} style={{ width: "95%" }} />
        </div>
        <div>
          <Steps
            direction="vertical"
            items={caseStepItems}
            className="case-step-wrapper"
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
