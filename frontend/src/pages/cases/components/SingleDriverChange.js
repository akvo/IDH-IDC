import React, { useMemo, useState } from "react";
import { Card, Space, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { CaseVisualState, CurrentCaseState } from "../store";
import { SegmentSelector } from "../components";
import { sumBy } from "lodash";
import { thousandFormatter } from "../../../components/chart/options/common";

// Constants
const TAG_COLORS = {
  success: "#01625f",
  warning: "#ffc505",
  danger: "#ff010e",
};

const BACKGROUND_COLORS = {
  warning: "#FFF4D1",
  danger: "#FFD0D3",
  success: "#DDF8E9",
  default: "#FFFFFF",
};

const COLUMN_WIDTHS = {
  default: 18.75,
  feasibility: 25,
};

const COLUMNS = [
  { key: "driver", label: "Driver" },
  { key: "neededValue", label: "Needed value" },
  { key: "neededChange", label: "Needed change" },
  { key: "maxFeasibleChange", label: "Maximum feasible change" },
  { key: "feasibility", label: "Feasibility" },
];

// Helper function to generate card grid styles
const generateCardGridStyle = ({
  header = false,
  columnKey = null,
  type = null,
  isLastRow = false,
  isFirstCol = false,
  isLastCol = false,
}) => {
  const backgroundColor = BACKGROUND_COLORS[type] || BACKGROUND_COLORS.default;
  const width =
    columnKey === "feasibility"
      ? COLUMN_WIDTHS.feasibility
      : COLUMN_WIDTHS.default;

  return {
    width: `${width}%`,
    textAlign: header ? "center" : "left",
    backgroundColor,
    padding: "12px 16px",
    borderBottomLeftRadius: isLastRow && isFirstCol ? "20px" : 0,
    borderBottomRightRadius: isLastRow && isLastCol ? "20px" : 0,
  };
};

// Render tag component for change columns
const ChangeTag = ({ value, type }) => {
  if (typeof value === "undefined" || value === null) {
    return null;
  }

  const Icon = value > 0 ? ArrowUpOutlined : ArrowDownOutlined;

  return (
    <Tag
      icon={<Icon style={{ fontSize: "12px" }} />}
      color={TAG_COLORS[type]}
      bordered={false}
      style={{
        borderRadius: "16px",
        padding: "2px 8px 2px 6px",
      }}
    >
      <span style={{ fontSize: "12px" }}>{value}%</span>
    </Tag>
  );
};

const SingleDriverChange = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { dashboardData, questionGroups } = CaseVisualState.useState((s) => s);

  const [selectedSegment, setSelectedSegment] = useState(null);

  const currentDashboardData = useMemo(
    () => dashboardData?.find((d) => d.id === selectedSegment),
    [dashboardData, selectedSegment]
  );

  const tableData = useMemo(() => {
    const incomeTarget = currentDashboardData?.target || 0;

    // current - feasible answers for each commodity/crop
    const primaryCommodityAnswers = currentDashboardData?.answers?.filter(
      (a) => a.commodityType === "focus"
    );
    const secondaryCommodityAnswers = currentDashboardData?.answers?.filter(
      (a) => a.commodityType === "secondary"
    );
    const tertiaryCommodityAnswers = currentDashboardData?.answers?.filter(
      (a) => a.commodityType === "tertiary"
    );
    const diversifiedCommodityAnswers = currentDashboardData?.answers?.filter(
      (a) => a.commodityType === "diversified"
    );
    // eol current - feasible answers for each commodity/crop

    const currentPrimary2 =
      primaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 2
      )?.value || 0;
    const currentPrimary3 =
      primaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 3
      )?.value || 0;
    const currentPrimary4 =
      primaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 4
      )?.value || 0;
    const currentPrimary5 =
      primaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 5
      )?.value || 0;
    const currentSecondaryIncome =
      secondaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 1
      )?.value || 0;
    const currentTertiaryIncome =
      tertiaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 1
      )?.value || 0;
    const currentOtherDiversifiedIncome = sumBy(
      diversifiedCommodityAnswers?.filter((a) => a.name === "current"),
      "value"
    );

    console.table({
      currentPrimary2,
      currentPrimary3,
      currentPrimary4,
      currentPrimary5,
      currentSecondaryIncome,
      currentTertiaryIncome,
      currentOtherDiversifiedIncome,
    });

    // commodity detail
    const primaryCommodity = questionGroups?.find(
      (qg) => qg?.case_commodity_type === "focus"
    );
    console.log(primaryCommodity);
    // eol commodity detail

    const mainDrivers = questionGroups?.[0]?.questions?.find(
      (q) => q?.question_type === "aggregator"
    )?.childrens;

    const data = mainDrivers.map((q) => {
      const qID = q.id;
      let rowData = {
        qid: qID,
      };
      let measurementUnit = "";
      if (q?.unit) {
        measurementUnit = q.unit
          .split("/")
          .map((u) => u.trim())
          .map((u) => {
            return u === "crop"
              ? primaryCommodity.name?.toLowerCase() || ""
              : primaryCommodity?.[u];
          })
          .join("/");
      }
      // populate the rowData
      COLUMNS.forEach(({ key: colKey }) => {
        rowData[colKey] = "NA";
        if (colKey === "driver") {
          rowData[colKey] = q.text;
        }
        if (colKey === "neededValue") {
          // for primary-2
          // needed_value = (income_target - secondary-1 - tertiary-1 - other_diversified_income) /
          //      ((primary-3 × primary-4) - primary-5)
          let neededValue = 0;
          if (qID === 2) {
            neededValue =
              (incomeTarget -
                currentSecondaryIncome -
                currentTertiaryIncome -
                currentOtherDiversifiedIncome) /
              (currentPrimary3 * currentPrimary4 - currentPrimary5);
          }
          //
          // for primary-3
          // needed_value = (income_target - secondary-1 - tertiary-1 - other_diversified_income + (primary-2 × primary-5)) /
          //      (primary-2 × primary-4)
          if (qID === 3) {
            neededValue =
              (incomeTarget -
                currentSecondaryIncome -
                currentTertiaryIncome -
                currentOtherDiversifiedIncome +
                currentPrimary2 * currentPrimary5) /
              (currentPrimary2 * currentPrimary4);
          }
          //
          // for primary-4
          // needed_value = (income_target - secondary-1 - tertiary-1 - other_diversified_income + (primary-2 × primary-5)) /
          //      (primary-2 × primary-3)
          //
          if (qID === 4) {
            neededValue =
              (incomeTarget -
                currentSecondaryIncome -
                currentTertiaryIncome -
                currentOtherDiversifiedIncome +
                currentPrimary2 * currentPrimary5) /
              (currentPrimary2 * currentPrimary3);
          }
          // for primary-5
          // needed_value = ((primary-2 × primary-3 × primary-4) + secondary-1 + tertiary-1 + other_diversified_income - income_target) /
          //  primary-2
          if (qID === 5) {
            neededValue =
              (currentPrimary2 * currentPrimary3 * currentPrimary4 +
                currentSecondaryIncome +
                currentTertiaryIncome +
                currentOtherDiversifiedIncome -
                incomeTarget) /
              currentPrimary2;
          }
          rowData[colKey] = `${thousandFormatter(
            neededValue,
            2
          )} ${measurementUnit}`;
        }
      });
      return rowData;
    });
    return data;
  }, [questionGroups, currentDashboardData]);

  // Default data for static component
  const defaultData = [
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

  const data = tableData;

  // Memoize whether columns should show tags
  const changeColumns = useMemo(
    () => new Set(["neededChange", "maxFeasibleChange"]),
    []
  );

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
          <SegmentSelector
            selectedSegment={selectedSegment}
            setSelectedSegment={setSelectedSegment}
          />
        </Space>
      }
    >
      {/* Header Row */}
      {COLUMNS.map((col) => (
        <Card.Grid
          style={generateCardGridStyle({ header: true, columnKey: col.key })}
          key={col.key}
          hoverable={false}
        >
          {col.label}
        </Card.Grid>
      ))}

      {/* Data Rows */}
      {data?.map((row, rowIndex) => {
        const isLastRow = rowIndex === data.length - 1;

        return COLUMNS.map((col, colIndex) => {
          const isFirstCol = colIndex === 0;
          const isLastCol = colIndex === COLUMNS.length - 1;
          const cellValue = row[col.key];
          const showTag = changeColumns.has(col.key);

          return (
            <Card.Grid
              key={`${col.key}-${rowIndex}`}
              style={generateCardGridStyle({
                columnKey: col.key,
                type: row.type,
                isLastRow,
                isFirstCol,
                isLastCol,
              })}
              hoverable={false}
            >
              <Space>
                <div>{cellValue}</div>
                {showTag && (
                  <ChangeTag value={row[`${col.key}Percent`]} type={row.type} />
                )}
              </Space>
            </Card.Grid>
          );
        });
      })}
    </Card>
  );
};

export default SingleDriverChange;
