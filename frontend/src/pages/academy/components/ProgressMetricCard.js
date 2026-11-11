import React from "react";
import { Progress } from "antd";
import { ACADEMY_PRIMARY_COLOR } from "../utils";

const RING_SIZE = 48;
const RING_STROKE_PX = 6;

const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

// KPI card: label, headline value and a circular progress ring
const ProgressMetricCard = ({ label, value, percent }) => {
  const safePercent = clampPercent(percent);
  return (
    <div className="academy-metric-card" data-testid="academy-metric-card">
      <p className="academy-metric-label">{label}</p>
      <div className="academy-metric-body">
        <span className="academy-metric-value">{value}</span>
        <Progress
          type="circle"
          size={RING_SIZE}
          // antd takes the circle stroke as a percentage of the ring size
          strokeWidth={(RING_STROKE_PX / RING_SIZE) * 100}
          // antd colours Progress from colorInfo, not the theme's colorPrimary
          strokeColor={ACADEMY_PRIMARY_COLOR}
          percent={safePercent}
          format={(p) => `${p}%`}
          aria-label={`${label}: ${safePercent}%`}
        />
      </div>
    </div>
  );
};

export default ProgressMetricCard;
