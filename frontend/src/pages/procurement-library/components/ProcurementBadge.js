import { Badge } from "antd";
import React from "react";
import { PROCUREMENT_PROCESS_COLORS } from "../config";
import "./procurement-badge.scss";

const ProcurementBadge = ({ id, text }) => {
  return (
    <span>
      <Badge
        color={
          PROCUREMENT_PROCESS_COLORS?.[id - 1] || PROCUREMENT_PROCESS_COLORS[0]
        }
        text={text}
      />
    </span>
  );
};

export default ProcurementBadge;
