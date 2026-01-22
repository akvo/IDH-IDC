import React, { useMemo } from "react";
import { Card, Space, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { CaseVisualState, CurrentCaseState } from "../store";
import { sumBy, min, max, upperFirst } from "lodash";
import { thousandFormatter } from "../../../components/chart/options/common";

// Constants
const TAG_COLORS = {
  success: "#b4dccf",
  warning: "#ffe8ac",
  danger: "#fea8af",
};

const TAG_FONT_COLORS = {
  success: "#01625f",
  warning: "#000",
  danger: "#ff010e",
};

const BACKGROUND_COLORS = {
  warning: "#FFF4D1",
  danger: "#FFD0D3",
  success: "#DDF8E9",
  default: "#FFFFFF",
  group: "#FFFFFF",
};

const COLUMN_WIDTHS = {
  group: 100,
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

// Default data for static component (FORMAT)
// const defaultData = [
//   {
//     group: "primary",
//     rowData: [
//       {
//         driver: "Land",
//         neededValue: "3 hectares",
//         neededChange: 1800,
//         neededChangePercent: 12,
//         maxFeasibleChange: 1800,
//         maxFeasibleChangePercent: 17,
//         feasibility: "Possible within feasible levels",
//         type: "success",
//       },
//     ],
//   },
// ];

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
      : columnKey === "group"
      ? COLUMN_WIDTHS.group
      : COLUMN_WIDTHS.default;

  return {
    width: `${width}%`,
    textAlign: header ? "center" : "left",
    backgroundColor,
    padding: "12px 16px",
    borderBottomLeftRadius: isLastRow && isFirstCol ? "20px" : 0,
    borderBottomRightRadius: isLastRow && isLastCol ? "20px" : 0,
    fontWeight: columnKey === "group" ? 500 : "normal",
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
      icon={<Icon style={{ fontSize: "12px", color: TAG_FONT_COLORS[type] }} />}
      color={TAG_COLORS[type]}
      bordered={false}
      style={{
        borderRadius: "16px",
        padding: "2px 8px 2px 6px",
      }}
    >
      <span style={{ fontSize: "12px", color: TAG_FONT_COLORS[type] }}>
        {value}%
      </span>
    </Tag>
  );
};

const SingleDriverChange = ({ selectedSegment }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { dashboardData, questionGroups } = CaseVisualState.useState((s) => s);

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

    // current
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

    // feasible
    const currentSecondary2 =
      secondaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 2
      )?.value || 0;
    const currentSecondary3 =
      secondaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 3
      )?.value || 0;
    const currentSecondary4 =
      secondaryCommodityAnswers?.find(
        (a) => a.name === "current" && a.questionId === 4
      )?.value || 0;
    const currentSecondary5 =
      secondaryCommodityAnswers?.find(
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

    // commodity detail
    const primaryCommodity = questionGroups?.find(
      (qg) => qg?.case_commodity_type === "focus"
    );
    // eol commodity detail

    const res = questionGroups?.map((qg) => {
      // if breakdown false use aggregator value for secondary crop
      // tertiary will always use aggregator value
      const breakdown = qg?.breakdown;
      const commodityType = qg?.case_commodity_type;

      const groupData = {
        group: qg?.commodity_type === "focus" ? "primary" : qg.commodity_type,
      };

      // populate questions as row base
      let questions = [];
      if (commodityType === "diversified") {
        questions = [
          {
            id: [qg?.questions?.map((q) => q.id)],
            parent: null,
            unit: "currency",
            question_type: "question",
            text: "Other diversified income",
            description: null,
            default_value: null,
            created_by: null,
            childrens: [],
          },
        ];
      } else if (
        commodityType === "tertiary" ||
        (commodityType === "secondary" && !breakdown)
      ) {
        questions = qg?.questions;
      } else {
        questions = qg?.questions?.find(
          (q) => q?.question_type === "aggregator"
        )?.childrens;
      }

      // populate current answers based on commodity type
      let answers = [];
      if (commodityType === "diversified") {
        answers = diversifiedCommodityAnswers;
      } else if (commodityType === "tertiary") {
        answers = tertiaryCommodityAnswers;
      } else if (commodityType === "secondary") {
        answers = secondaryCommodityAnswers;
      } else {
        answers = primaryCommodityAnswers;
      }

      const data = questions?.map((q) => {
        const qID = q.id;
        const rowData = {
          qid: qID,
        };

        let measurementUnit = "";
        if (q?.unit) {
          measurementUnit = q.unit
            .split("/")
            .map((u) => u.trim())
            .map((u) => {
              if (u === "currency") {
                return currentCase?.currency || "";
              }
              return u === "crop"
                ? primaryCommodity.name?.toLowerCase() || ""
                : primaryCommodity?.[u];
            })
            .join("/");
        }

        // needed value calculation
        // for primary-2
        // needed_value = (secondary-1 + tertiary-1 + other_diversified_income - income_target) / (primary-5 - (primary-3*primary-4))
        let neededValue = 0;
        if (commodityType === "focus" && qID === 2) {
          neededValue =
            (currentSecondaryIncome +
              currentTertiaryIncome +
              currentOtherDiversifiedIncome -
              incomeTarget) /
            (currentPrimary5 - currentPrimary3 * currentPrimary4);
        }
        //
        // for primary-3
        // needed_value = ((primary-5*primary-2) - secondary-1 - tertiary-1 - other_diversified_income + income_target) / (primary-2*primary-4)
        if (commodityType === "focus" && qID === 3) {
          neededValue =
            (currentPrimary5 * currentPrimary2 -
              currentSecondaryIncome -
              currentTertiaryIncome -
              currentOtherDiversifiedIncome +
              incomeTarget) /
            (currentPrimary2 * currentPrimary4);
        }
        //
        // for primary-4
        // needed_value = ((primary-5*primary-2) - secondary-1 - tertiary-1 - other_diversified_income + income_target) / (primary-2*primary-3)
        if (commodityType === "focus" && qID === 4) {
          neededValue =
            (currentPrimary5 * currentPrimary2 -
              currentSecondaryIncome -
              currentTertiaryIncome -
              currentOtherDiversifiedIncome +
              incomeTarget) /
            (currentPrimary2 * currentPrimary3);
        }
        // for primary-5
        // needed_value = ((primary-2*primary-3*primary-4)+secondary-1+tertiary-1+other_diversified_income-income_target)/primary-2
        if (commodityType === "focus" && qID === 5) {
          neededValue =
            (currentPrimary2 * currentPrimary3 * currentPrimary4 +
              currentSecondaryIncome +
              currentTertiaryIncome +
              currentOtherDiversifiedIncome -
              incomeTarget) /
            currentPrimary2;
        }

        // secondary-1
        // needed_value = (primary-5*primary-2) - (primary-2*primary-3*primary-4) - tertiary-1 - other_diversified_income + income_target
        if (commodityType === "secondary" && !breakdown && qID === 1) {
          neededValue =
            currentPrimary5 * currentPrimary2 -
            currentPrimary2 * currentPrimary3 * currentPrimary4 -
            currentTertiaryIncome -
            currentOtherDiversifiedIncome +
            incomeTarget;
        }

        // secondary-2
        // needed_value = (income_target - (primary-2*primary-3*primary-4) - tertiary-1 - other_diversified_income + (primary-5*primary-2)) / (secondary-3*secondary-4 - secondary-5)
        if (commodityType === "secondary" && breakdown && qID === 2) {
          neededValue =
            (incomeTarget -
              currentPrimary2 * currentPrimary3 * currentPrimary4 -
              currentTertiaryIncome -
              currentOtherDiversifiedIncome +
              currentPrimary5 * currentPrimary2) /
            (currentSecondary3 * currentSecondary4 - currentSecondary5);
        }

        // secondary-3
        // needed_value = ((income_target - (primary-2*primary-3*primary-4) - tertiary-1 - other_diversified_income + (primary-5*primary-2*)) + (secondary-2*secondary-5)) / (secondary-2*secondary-4)
        if (commodityType === "secondary" && breakdown && qID === 3) {
          neededValue =
            incomeTarget -
            currentPrimary2 * currentPrimary3 * currentPrimary4 -
            currentTertiaryIncome -
            currentOtherDiversifiedIncome +
            currentPrimary5 * currentPrimary2 +
            (currentSecondary2 * currentSecondary5) /
              (currentSecondary2 * currentSecondary4);
        }

        // secondary-4
        // needed_value = ((income_target - (primary-2*primary-3*primary-4) - tertiary-1 - other_diversified_income + (primary-5*primary-2)) + (secondary-2*secondary-5)) / (secondary-2*secondary-3)
        if (commodityType === "secondary" && breakdown && qID === 4) {
          neededValue =
            (incomeTarget -
              currentPrimary2 * currentPrimary3 * currentPrimary4 -
              currentTertiaryIncome -
              currentOtherDiversifiedIncome +
              currentPrimary5 * currentPrimary2 +
              currentSecondary2 * currentSecondary5) /
            (currentSecondary2 * currentSecondary3);
        }

        // secondary-5
        // needed_value = (secondary-3*secondary-4) - ((income_target - (primary-2*primary-3*primary-4) - tertiary-1 - other_diversified_income + (primary-5*primary-2)) / secondary-2)
        if (commodityType === "secondary" && breakdown && qID === 5) {
          neededValue =
            currentSecondary3 * currentSecondary4 -
            (incomeTarget -
              currentPrimary2 * currentPrimary3 * currentPrimary4 -
              currentTertiaryIncome -
              currentOtherDiversifiedIncome +
              currentPrimary5 * currentPrimary2) /
              currentSecondary2;
        }

        // tertiary-1
        // needed_value = (primary-5*primary-2) - (primary-2*primary-3*primary-4) - secondary-1 - other_diversified_income + income_target
        if (commodityType === "tertiary" && qID === 1) {
          neededValue =
            currentPrimary5 * currentPrimary2 -
            currentPrimary2 * currentPrimary3 * currentPrimary4 -
            currentSecondaryIncome -
            currentOtherDiversifiedIncome +
            incomeTarget;
        }

        // other diversified income
        // needed_value = (primary-5*primary-2) - (primary-2*primary-3*primary-4) - secondary-1 - tertiary-1 + income_target
        if (commodityType === "diversified") {
          neededValue =
            currentPrimary5 * currentPrimary2 -
            currentPrimary2 * currentPrimary3 * currentPrimary4 -
            currentSecondaryIncome -
            currentTertiaryIncome +
            incomeTarget;
        }
        // eol needed value calculation

        // populate answers by qid
        let currentValue =
          answers?.find((a) => a.name === "current" && a.questionId === qID)
            ?.value || 0;
        let feasibleValue =
          answers?.find((a) => a.name === "feasible" && a.questionId === qID)
            ?.value || 0;
        if (commodityType === "diversified") {
          currentValue = sumBy(
            answers?.filter((a) => a.name === "current"),
            "value"
          );
          feasibleValue = sumBy(
            answers?.filter((a) => a.name === "feasible"),
            "value"
          );
        }
        // eol populate answers by qid

        // populate the rowData
        COLUMNS.forEach(({ key: colKey }) => {
          rowData[colKey] = "NA";
          if (colKey === "driver") {
            rowData[colKey] = q.text;
          }
          if (colKey === "neededValue") {
            rowData[colKey] = `${thousandFormatter(
              neededValue,
              2
            )} ${measurementUnit}`;
          }
          if (colKey === "neededChange") {
            const neededChange = neededValue - currentValue;
            const neededChangePercent =
              currentValue > 0 ? (neededChange / currentValue) * 100 : 0;
            rowData[colKey] = thousandFormatter(neededChange, 2);
            rowData[`${colKey}Percent`] = thousandFormatter(
              neededChangePercent,
              2
            );
          }
          if (colKey === "maxFeasibleChange") {
            const maxFeasibleChange = feasibleValue - currentValue;
            const maxFeasibleChangePercent =
              currentValue > 0 ? (maxFeasibleChange / currentValue) * 100 : 0;
            rowData[colKey] = thousandFormatter(maxFeasibleChange, 2);
            rowData[`${colKey}Percent`] = thousandFormatter(
              maxFeasibleChangePercent,
              2
            );
          }
          if (colKey === "feasibility") {
            const lowerBound = min(currentValue, feasibleValue);
            const upperBound = max(currentValue, feasibleValue);
            let feasibility = "";
            let type = null;
            if (neededValue < 0) {
              feasibility = "Not possible";
              type = "danger";
            } else if (lowerBound <= neededValue <= upperBound) {
              feasibility = "Possible within feasible levels";
              type = "success";
            } else {
              feasibility = "Possible outside of feasible levels";
              type = "warning";
            }
            rowData[colKey] = feasibility;
            rowData["type"] = type;
          }
        });
        return rowData;
      });

      groupData["rowData"] = data;
      return groupData;
    });
    return res;
  }, [questionGroups, currentDashboardData, currentCase]);

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
      {tableData?.map((d, groupIndex) => {
        const groupName =
          d.group === "diversified"
            ? "Other Diversified"
            : `${upperFirst(d.group)}`;

        const groupCardGrid = [
          <Card.Grid
            key={`${d.group}-${groupIndex}`}
            style={generateCardGridStyle({
              columnKey: "group",
              type: "group",
            })}
            hoverable={false}
          >
            <div>{groupName}</div>
          </Card.Grid>,
        ];

        const rowCardGrid = d?.rowData?.map((row, rowIndex) => {
          const isLastRow = groupIndex === tableData?.length - 1;
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
                    <ChangeTag
                      value={row[`${col.key}Percent`]}
                      type={row.type}
                    />
                  )}
                </Space>
              </Card.Grid>
            );
          });
        });

        return [...groupCardGrid, ...rowCardGrid];
      })}
    </Card>
  );
};

export default SingleDriverChange;
