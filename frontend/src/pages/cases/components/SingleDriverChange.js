import React from "react";
import { Card, Space, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";

const tagColors = {
  success: "#01625f",
  warning: "#ffc505",
  danger: "#ff010e",
};

const generateCardGridStyle = ({
  header = false,
  columnKey = null,
  type = null,
  isLastRow = false,
  isFirstCol = false,
  isLastCol = false,
}) => {
  let backgroundColor = "";
  switch (type) {
    case "warning":
      backgroundColor = "#FFF4D1";
      break;
    case "danger":
      backgroundColor = "#FFD0D3";
      break;
    case "success":
      backgroundColor = "#DDF8E9";
      break;
    default:
      backgroundColor = "#FFFFFF";
      break;
  }

  let width = 18.75; // %
  if (columnKey === "feasibility") {
    width = 25;
  }

  return {
    width: `${width}%`,
    textAlign: header ? "center" : "left",
    backgroundColor: backgroundColor,
    padding: "12px 16px",
    borderBottomLeftRadius: isLastRow && isFirstCol ? "20px" : 0,
    borderBottomRightRadius: isLastRow && isLastCol ? "20px" : 0,
  };
};

const columns = [
  {
    key: "driver",
    label: "Driver",
  },
  {
    key: "neededValue",
    label: "Needed value",
  },
  {
    key: "neededChange",
    label: "Needed change",
  },
  {
    key: "maxFeasibleChange",
    label: "Maximum feasible change",
  },
  {
    key: "feasibility",
    label: "Feasibility",
  },
];

const SingleDriverChange = () => {
  const data = [
    {
      driver: "Land",
      neededValue: "3 hectares",
      neededChange: 1800,
      neededChangePercent: 12,
      maxFeasibleChange: 1800,
      maxFeasibleChangePercent: 17,
      feasibility: "Possible within feasible levels",
      type: "success",
    },
    {
      driver: "Price",
      neededValue: "127 LCU",
      neededChange: "15.25 USD",
      neededChangePercent: 78,
      maxFeasibleChange: 1800,
      maxFeasibleChangePercent: 42,
      feasibility: "Possible outside of feasible levels",
      type: "warning",
    },
    {
      driver: "Volume",
      neededValue: "1750 kg/hectare",
      neededChange: "2100 kg",
      neededChangePercent: 72,
      maxFeasibleChange: 1800,
      maxFeasibleChangePercent: 32,
      feasibility: "Possible outside of feasible levels",
      type: "warning",
    },
    {
      driver: "Cost of production",
      neededValue: "-32 LCU",
      neededChange: "111 USD/hectare",
      neededChangePercent: -12,
      maxFeasibleChange: 1800,
      maxFeasibleChangePercent: -12,
      feasibility: "Not possible",
      type: "danger",
    },
  ];

  return (
    <Card
      className="card-content-wrapper card-with-gray-header-wrapper"
      title={
        <Space direction="vertical">
          <div className="title">
            <b>Single driver change</b>
          </div>
          <div className="description">
            The table below shows the minimum change needed in each driver,
            while keeping all others at their current levels, to close the
            income gap.
          </div>
        </Space>
      }
    >
      {/* Header */}
      {columns.map((col) => (
        <Card.Grid
          style={generateCardGridStyle({ header: true, columnKey: col.key })}
          key={col.key}
          hoverable={false}
        >
          {col.label}
        </Card.Grid>
      ))}
      {/* EOL Header */}

      {/* Values */}
      {data.map((d, di) => {
        const isLastRow = data?.length - 1 === di;
        return columns.map(({ key }, ci) => {
          const cellValue = d[key];
          const isFirstCol = ci === 0;
          const isLastCol = columns?.length - 1 === ci;

          // renderTag
          let tagComponent = null;
          if (key === "neededChange" || key === "maxFeasibleChange") {
            const tagValue = d?.[`${key}Percent`];
            const tagIcon =
              tagValue > 0 ? (
                <ArrowUpOutlined style={{ fontSize: "12px" }} />
              ) : (
                <ArrowDownOutlined style={{ fontSize: "12px" }} />
              );
            tagComponent = (
              <Tag
                icon={tagIcon}
                color={tagColors[d.type]}
                bordered={false}
                style={{
                  borderRadius: "16px",
                  padding: "2px 8px 2px 6px",
                }}
              >
                <span style={{ fontSize: "12px" }}>{tagValue}%</span>
              </Tag>
            );
          }

          return (
            <Card.Grid
              key={`${key}-${di}-${ci}`}
              style={generateCardGridStyle({
                columnKey: key,
                type: d.type,
                isLastRow,
                isFirstCol,
                isLastCol,
              })}
              hoverable={false}
            >
              <Space>
                <div>{cellValue}</div>
                <div> {tagComponent}</div>
              </Space>
            </Card.Grid>
          );
        });
      })}

      {/* EOL Values */}
    </Card>
  );
};

export default SingleDriverChange;
