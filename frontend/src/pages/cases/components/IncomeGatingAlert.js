import React from "react";
import { Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const IncomeGatingAlert = ({ style = {} }) => {
  return (
    <Alert
      type="info"
      showIcon
      icon={
        <InfoCircleOutlined
          style={{
            color: "#01625f",
            fontSize: "24px",
            marginTop: "4px", // Subtle adjustment for better alignment with RocGrotesk title
          }}
        />
      }
      message={
        <span
          style={{
            color: "#01625f",
            fontWeight: 700,
            fontFamily: "RocGrotesk",
            fontSize: "16px",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Income target reached
        </span>
      }
      description={
        <span
          style={{
            color: "#01625f",
            fontFamily: "TabletGothic",
            fontSize: "14px",
            lineHeight: "20px",
            display: "block",
          }}
        >
          Farmers in this segment already earn more than the income target. This
          feature is therefore disabled.
        </span>
      }
      style={{
        backgroundColor: "#eaf2f2",
        border: "1px solid #01625f",
        borderRadius: "20px",
        padding: "20px 24px",
        display: "flex",
        alignItems: "flex-start", // Keep top-aligned but with balanced padding
        ...style,
      }}
    />
  );
};

export default IncomeGatingAlert;
