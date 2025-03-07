import React from "react";
import { Result } from "antd";

const Practice = () => {
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
      <h1>Practice</h1>
      <Result status="404" title="Page coming soon." />
    </div>
  );
};

export default Practice;
