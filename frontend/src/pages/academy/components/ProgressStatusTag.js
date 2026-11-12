import React from "react";
import { PROGRESS_STATUS } from "../utils";
import "./ProgressStatusTag.scss";

const statusModifier = {
  [PROGRESS_STATUS.completed]: "completed",
  [PROGRESS_STATUS.inProgress]: "in-progress",
  [PROGRESS_STATUS.notStarted]: "not-started",
};

const ProgressStatusTag = ({ status }) => {
  const modifier = statusModifier[status] || "not-started";
  return (
    <span className={`academy-status-tag academy-status-tag--${modifier}`}>
      {status || PROGRESS_STATUS.notStarted}
    </span>
  );
};

export default ProgressStatusTag;
