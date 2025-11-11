import React from "react";
import { Space, Tooltip } from "antd";
import EnvironmentIcon from "../../../assets/icons/procurement-library/environment.png";
import IncomeIcon from "../../../assets/icons/procurement-library/income.png";
import "./impact-area-icons.scss";

const ImpactAreaIcons = ({ isEnv = false, isIncome = false }) => {
  return (
    <div className="container">
      <Space>
        {isEnv && (
          <Tooltip title="Environmental Impact">
            <span className="environment">
              <img src={EnvironmentIcon} alt="environmental impact" />
            </span>
          </Tooltip>
        )}
        {isIncome && (
          <Tooltip title="Farmer Income">
            <span className="income">
              <img src={IncomeIcon} alt="farmer income" />
            </span>
          </Tooltip>
        )}
      </Space>
    </div>
  );
};

export default ImpactAreaIcons;
