import React from "react";
import { Space, Tooltip } from "antd";
import { DollarSignIcon, LeafIcon } from "../../../lib/icon";
import "./impact-area-icons.scss";

const ImpactAreaIcons = ({ isEnv = false, isIncome = false }) => {
  return (
    <div className="container">
      <Space>
        {isEnv && (
          <Tooltip title="Environmental Impact">
            <span className="environment">
              <LeafIcon />
            </span>
          </Tooltip>
        )}
        {isIncome && (
          <Tooltip title="Farmer Income">
            <span className="income">
              <DollarSignIcon />
            </span>
          </Tooltip>
        )}
      </Space>
    </div>
  );
};

export default ImpactAreaIcons;
