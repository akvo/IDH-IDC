import React, { useMemo } from "react";
import { Card, Space, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { CaseVisualState, CurrentCaseState } from "../store";
import { IncomeGatingAlert } from "./index";
import { sumBy, min, max, upperFirst } from "lodash";
import { thousandFormatter } from "../../../components/chart/options/common";
import {
  getTargetPrimaryIncome,
  getTargetSecondaryIncome,
  getTargetTertiaryIncome,
  getTargetDiversifiedIncome,
  calculateBreakdownDriver,
} from "../utils/incomeCalculations";

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
      icon={
        value === 0 ? (
          ""
        ) : (
          <Icon style={{ fontSize: "12px", color: TAG_FONT_COLORS[type] }} />
        )
      }
      color={TAG_COLORS[type]}
      bordered={false}
      style={{
        borderRadius: "16px",
        padding: "2px 8px 2px 6px",
      }}
    >
      <span style={{ fontSize: "12px", color: TAG_FONT_COLORS[type] }}>
        {thousandFormatter(value, 2)}%
      </span>
    </Tag>
  );
};

const SingleDriverChange = ({ selectedSegment }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { dashboardData, questionGroups, sensitivityAnalysis } =
    CaseVisualState.useState((s) => s);

  const adjustedIncometarget = useMemo(() => {
    const adjustedTarget =
      sensitivityAnalysis?.config?.[`${selectedSegment}_adjusted-target`] || 0;
    return adjustedTarget;
  }, [sensitivityAnalysis?.config, selectedSegment]);

  const currentDashboardData = useMemo(
    () => dashboardData?.find((d) => d.id === selectedSegment),
    [dashboardData, selectedSegment]
  );

  const incomeTarget = useMemo(() => {
    const currentTarget = currentDashboardData?.target || 0;
    return adjustedIncometarget ? adjustedIncometarget : currentTarget;
  }, [currentDashboardData?.target, adjustedIncometarget]);

  const isAboveTarget = useMemo(() => {
    return (
      (currentDashboardData?.total_current_income || 0) >= (incomeTarget || 0)
    );
  }, [currentDashboardData?.total_current_income, incomeTarget]);

  const tableData = useMemo(() => {
    if (isAboveTarget) {
      return [];
    }

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

      const answers =
        commodityType === "diversified"
          ? diversifiedCommodityAnswers
          : commodityType === "tertiary"
          ? tertiaryCommodityAnswers
          : commodityType === "secondary"
          ? secondaryCommodityAnswers
          : primaryCommodityAnswers;

      const primaryCategory =
        primaryCommodity?.commodity_category?.toLowerCase();
      const primaryQidMap =
        primaryCategory === "livestock"
          ? { price: 42, volume: 41, cop: 43, land: 40 }
          : primaryCategory === "aquaculture"
          ? { price: 4, volume: 3, cop: 26, land: 2 }
          : { price: 4, volume: 3, cop: 5, land: 2 };

      const commodityCategory = qg?.commodity_category?.toLowerCase();
      const qidMap =
        commodityCategory === "livestock"
          ? { price: 42, volume: 41, cop: 43, land: 40 }
          : commodityCategory === "aquaculture"
          ? { price: 4, volume: 3, cop: 26, land: 2 }
          : { price: 4, volume: 3, cop: 5, land: 2 };

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
              if (u === "crop") {
                return primaryCommodity.name?.toLowerCase() || "";
              }
              if (u === "land" || u === "area_size_unit") {
                return primaryCommodity?.area_size_unit || "";
              }
              if (u === "volume" || u === "volume_measurement_unit") {
                return primaryCommodity?.volume_measurement_unit || "";
              }
              return primaryCommodity?.[u] || u;
            })
            .filter((u) => u)
            .join("/");
        }

        const getAnswer = (commodityAnswers, qId, type = "current") =>
          commodityAnswers?.find((a) => a.name === type && a.questionId === qId)
            ?.value || 0;

        const primaryDrivers = {
          d2: getAnswer(primaryCommodityAnswers, primaryQidMap.land),
          d3: getAnswer(primaryCommodityAnswers, primaryQidMap.volume),
          d4: getAnswer(primaryCommodityAnswers, primaryQidMap.price),
          d5: getAnswer(primaryCommodityAnswers, primaryQidMap.cop),
        };

        const secQidMap =
          qg?.commodity_category === "Livestock"
            ? { price: 42, volume: 41, cop: 43, land: 40 }
            : qg?.commodity_category === "Aquaculture"
            ? { price: 4, volume: 3, cop: 26, land: 2 }
            : { price: 4, volume: 3, cop: 5, land: 2 };

        const secondaryDrivers = {
          d2: getAnswer(secondaryCommodityAnswers, secQidMap.land),
          d3: getAnswer(secondaryCommodityAnswers, secQidMap.volume),
          d4: getAnswer(secondaryCommodityAnswers, secQidMap.price),
          d5: getAnswer(secondaryCommodityAnswers, secQidMap.cop),
        };

        const currentPrimaryIncome =
          primaryDrivers.d2 *
          (primaryDrivers.d3 * primaryDrivers.d4 - primaryDrivers.d5);

        const currentSecondaryIncome = getAnswer(secondaryCommodityAnswers, 1);
        const currentTertiaryIncome = getAnswer(tertiaryCommodityAnswers, 1);
        const currentOtherDiversifiedIncome = sumBy(
          diversifiedCommodityAnswers?.filter((a) => a.name === "current"),
          "value"
        );

        // needed value calculation
        let neededValue = 0;

        if (commodityType === "focus") {
          const targetPrimary = getTargetPrimaryIncome(
            incomeTarget,
            currentSecondaryIncome,
            currentTertiaryIncome,
            currentOtherDiversifiedIncome
          );
          neededValue = calculateBreakdownDriver(
            targetPrimary,
            primaryDrivers,
            qID === qidMap.land
              ? 2
              : qID === qidMap.volume
              ? 3
              : qID === qidMap.price
              ? 4
              : qID === qidMap.cop
              ? 5
              : qID
          );
        } else if (commodityType === "secondary") {
          const targetSecondary = getTargetSecondaryIncome(
            incomeTarget,
            currentPrimaryIncome,
            currentTertiaryIncome,
            currentOtherDiversifiedIncome
          );
          if (breakdown) {
            neededValue = calculateBreakdownDriver(
              targetSecondary,
              secondaryDrivers,
              qID === secQidMap.land
                ? 2
                : qID === secQidMap.volume
                ? 3
                : qID === secQidMap.price
                ? 4
                : qID === secQidMap.cop
                ? 5
                : qID
            );
          } else if (qID === 1) {
            neededValue = targetSecondary;
          }
        } else if (commodityType === "tertiary" && qID === 1) {
          neededValue = getTargetTertiaryIncome(
            incomeTarget,
            currentPrimaryIncome,
            currentSecondaryIncome,
            currentOtherDiversifiedIncome
          );
        } else if (commodityType === "diversified") {
          neededValue = getTargetDiversifiedIncome(
            incomeTarget,
            currentPrimaryIncome,
            currentSecondaryIncome,
            currentTertiaryIncome
          );
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
            rowData[`${colKey}Percent`] = neededChangePercent;
          }
          if (colKey === "maxFeasibleChange") {
            const maxFeasibleChange = feasibleValue - currentValue;
            const maxFeasibleChangePercent =
              currentValue > 0 ? (maxFeasibleChange / currentValue) * 100 : 0;
            rowData[colKey] = thousandFormatter(maxFeasibleChange, 2);
            rowData[`${colKey}Percent`] = maxFeasibleChangePercent;
          }
          if (colKey === "feasibility") {
            const lowerBound = min([currentValue, feasibleValue]);
            const upperBound = max([currentValue, feasibleValue]);
            let feasibility = "";
            let type = null;

            if (neededValue < 0) {
              feasibility = "Not possible";
              type = "danger";
            } else if (neededValue >= lowerBound && neededValue <= upperBound) {
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
  }, [
    questionGroups,
    currentDashboardData,
    currentCase,
    incomeTarget,
    isAboveTarget,
  ]);

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
      {isAboveTarget ? (
        <IncomeGatingAlert style={{ margin: "20px" }} />
      ) : (
        COLUMNS.map((col) => (
          <Card.Grid
            style={generateCardGridStyle({ header: true, columnKey: col.key })}
            key={col.key}
            hoverable={false}
          >
            {col.label}
          </Card.Grid>
        ))
      )}

      {!isAboveTarget &&
        tableData?.flatMap((d, groupIndex) => {
          const groupName =
            d.group === "diversified"
              ? "Other Diversified"
              : `${upperFirst(d.group)}`;

          const groupCardGrid = (
            <Card.Grid
              key={`group-${groupIndex}`}
              style={generateCardGridStyle({
                columnKey: "group",
                type: "group",
              })}
              hoverable={false}
            >
              <div>{groupName}</div>
            </Card.Grid>
          );

          const rowCardGrids = d?.rowData?.flatMap((row, rowIndex) => {
            const isLastRow = groupIndex === tableData?.length - 1;
            return COLUMNS.map((col, colIndex) => {
              const isFirstCol = colIndex === 0;
              const isLastCol = colIndex === COLUMNS.length - 1;
              const cellValue = row[col.key];
              const showTag = changeColumns.has(col.key);

              return (
                <Card.Grid
                  key={`row-${groupIndex}-${rowIndex}-${col.key}`}
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

          return [groupCardGrid, ...rowCardGrids];
        })}
    </Card>
  );
};

export default SingleDriverChange;
