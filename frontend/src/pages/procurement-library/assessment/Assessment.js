import React from "react";
import { Result } from "antd";

const Assessment = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "7rem",
        flexDirection: "column",
      }}
    >
      <h1>Assessment</h1>
      <Result status="404" title="Page coming soon." />
    </div>
  );
};

export default Assessment;
