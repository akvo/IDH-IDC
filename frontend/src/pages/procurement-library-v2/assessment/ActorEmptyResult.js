import React from "react";
import { Result } from "antd";
import "./assessment.scss";
import VCANoResult from "../../../assets/icons/procurement-library/vca-no-result.png";

const ActorEmptyResult = ({ title }) => (
  <Result
    icon={
      <img
        src={VCANoResult}
        alt="empty result icon"
        className="vca-no-result-icon"
      />
    }
    title={title}
  />
);

export default ActorEmptyResult;
