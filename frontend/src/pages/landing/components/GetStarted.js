import React from "react";
import { Image, Steps } from "antd";
import "./landingcomp.scss";
import GetStartedImg from "../../../assets/images/get-started.png";

const GetStarted = () => {
  const items = [
    {
      title:
        "Set an income target: use a living income benchmark or define the target yourself",
      description:
        "Set an income target: define the target yourself or rely on a living income.",
    },
    {
      title: "Enter your income data",
      description:
        "Enter current and feasible data for the five income drivers and its subcomponents for each segment.",
    },
    {
      title: "Understand the income gap",
      description:
        "Explore the current income situation and the gap to reach your income target.",
    },
    {
      title: "Assess impact of mitigation strategies",
      description:
        "Analyze which drivers impact income increase the most, and how to close the gap.",
    },
    {
      title: "Closing the gap",
      description:
        "Save different scenarios to close the gap, and explore procurement practices.",
    },
  ];

  return (
    <div id="get-started">
      <div className="image-wrapper">
        <h2>What is the current income of the farmers and their income gap?</h2>
        <Image src={GetStartedImg} preview={false} style={{ width: "93%" }} />
      </div>
      <div>
        <Steps
          direction="vertical"
          items={items}
          className="case-step-wrapper"
          size="small"
        />
      </div>
    </div>
  );
};

export default GetStarted;
