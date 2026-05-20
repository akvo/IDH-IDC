import React from "react";
import { Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const ReadOnlyAlert = ({ style = {} }) => {
  return (
    <Alert
      type="info"
      showIcon
      icon={
        <InfoCircleOutlined
          style={{
            color: "#0098FF",
            fontSize: "22px",
          }}
        />
      }
      message={
        <span
          style={{
            fontWeight: 700,
            fontSize: "14px",
            color: "#000",
            marginBottom: 0,
          }}
        >
          Read only
        </span>
      }
      description={
        <span
          style={{
            fontSize: "14px",
            color: "#111",
            lineHeight: "22px",
          }}
        >
          Please contact your instance administrator to get access to edit these
          settings.
        </span>
      }
      style={{
        backgroundColor: "#EAF7FF",
        border: "1px solid #34ADFF",
        borderLeft: "4px solid #34ADFF",
        borderRadius: "16px",
        padding: "12px",
        display: "flex",
        alignItems: "flex-start",
        ...style,
      }}
    />
  );
};

export default ReadOnlyAlert;
