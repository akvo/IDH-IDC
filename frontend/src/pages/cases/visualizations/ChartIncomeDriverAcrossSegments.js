import React, { useState, useMemo, useRef } from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";
import { getColumnStackBarOptions } from "../../../components/chart/lib";
import Chart from "../../../components/chart";
import { IncomeDriversDropdown } from "../components";
import { uniqBy, capitalize, groupBy, snakeCase } from "lodash";
import { CaseVisualState, CurrentCaseState } from "../store";

const showDriversBreakdownValue = false;
const otherCommodities = ["secondary", "tertiary"];

const currentColors = [
  "#1b726f", // Dark Cyan
  "#81e4ab", // Pale Green
  "#fecb21", // Maximum Yellow Red
  "#4eb8ff", // Dodger Blue
  "#ff8f4e", // Atomic Tangerine
  "#725b1b", // Olive Brown
  "#ad1b72", // Rose Red
  "#214b72", // Prussian Blue
  "#724a1b", // Raw Sienna
  "#1b7272", // Skobeloff
  "#721b49", // Plum Purple
  "#1b724a", // Jungle Green
  "#721b1b", // Persian Red
  "#4a721b", // Olive Drab
  "#1b4a72", // Dark Slate Blue
  "#1b7261", // Tropical Rain Forest
];

const feasibleColors = [
  "#9cc2c1", // Silver Sand (Lighter Version of #1b726f)
  "#ddf8e9", // Honeydew (Lighter Version of #81e4ab)
  "#ffeeb8", // Moccasin (Lighter Version of #fecb21)
  "#d0ecff", // Lavender Blue (Lighter Version of #4eb8ff)
  "#ffe1d0", // Peach Yellow (Lighter Version of #ff8f4e)
  "#9e8a4d", // Shadow (Lighter Version of #725b1b)
  "#d44a94", // Blush (Lighter Version of #ad1b72)
  "#41799d", // Steel Blue (Lighter Version of #214b72)
  "#ad8a4d", // Café Au Lait (Lighter Version of #724a1b)
  "#4d9e9e", // Viridian Green (Lighter Version of #1b7272)
  "#94486e", // Mulberry (Lighter Version of #721b49)
  "#4d944a", // Turtle Green (Lighter Version of #1b724a)
  "#944848", // Chestnut Rose (Lighter Version of #721b1b)
  "#6e9448", // La Palma (Lighter Version of #4a721b)
  "#486e94", // Jelly Bean (Lighter Version of #1b4a72)
  "#487e6e", // Jaguar (Lighter Version of #1b7261)
];
const ChartIncomeDriverAcrossSegments = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [axisTitle, setAxisTitle] = useState(currentCase.currency);
  const [showLabel, setShowLabel] = useState(false);
  const chartBreakdownDriverRef = useRef(null);

  const driverOptionsDropdown = useMemo(() => {
    if (!dashboardData.length) {
      return [];
    }
    const selectedSegmentData = dashboardData[0];
    const focusCommodityAnswers = selectedSegmentData.answers.filter(
      (a) => a.commodityFocus && a.question.question_type !== "diversified"
    );
    const driverQuestions =
      uniqBy(
        focusCommodityAnswers.map((a) => a.question),
        "id"
      ).find((q) => !q.parent)?.childrens || [];
    const focusRes = driverQuestions.map((q) => ({
      label: q.text,
      type: "focus",
      value: q.id,
      default_value: q.default_value,
      childrens: q.childrens.map((q) => ({ ...q, type: "focus" })),
    }));
    // .filter((x) => x.value !== 2); // remove land driver from dropdown
    // add secondary - tertiary value
    const additonalCommodities = otherCommodities
      .map((x) => {
        const commodity = selectedSegmentData.answers.find(
          (a) =>
            a.commodityType === x && a.question.question_type !== "diversified"
        );
        if (!commodity) {
          return false;
        }
        return {
          text: `Total ${capitalize(x)} /\nNon Primary - ${
            commodity.commodityName
          }`,
          type: x,
          id: x,
        };
      })
      .filter((x) => x);
    // add diversified questions
    let diversifiedQuestions = selectedSegmentData.answers
      .filter(
        (a) =>
          a.commodityType === "diversified" &&
          a.question.question_type === "diversified"
      )
      .flatMap((a) => a.question);
    diversifiedQuestions = uniqBy(diversifiedQuestions, "id").map((q) => ({
      ...q,
      type: "diversified",
    }));
    const diversifiedRes = [
      {
        label: "Diversified Income",
        type: "diversified",
        value: "diversified",
        childrens: [...additonalCommodities, ...diversifiedQuestions],
      },
    ];
    return [...focusRes, ...diversifiedRes];
  }, [dashboardData]);

  const chartData = useMemo(() => {
    setLoading(true);
    if (!driverOptionsDropdown.length) {
      setLoading(false);
      return [];
    }
    const res = ["current", "feasible"]
      .map((x) => {
        const colors = x === "current" ? currentColors : feasibleColors;
        const data = dashboardData
          .map((selectedSegmentData) => {
            const title = `${capitalize(x)}\n${selectedSegmentData.name}`;
            let stack = [];
            if (!selectedDriver) {
              stack = driverOptionsDropdown.map((d, di) => {
                let value = 0;
                // Calculate focus commodity
                if (d.type === "focus") {
                  const answer = selectedSegmentData.answers
                    .filter((a) => a.commodityFocus && a.name === x)
                    .find((a) => a.questionId === d.value);
                  value = answer && answer.value ? answer.value : 0;
                }
                // diversified
                if (d.type === "diversified" && d.value === "diversified") {
                  value =
                    selectedSegmentData?.[`total_${x}_diversified_income`] || 0;
                }
                value = value ? parseFloat(value.toFixed(2)) : value;
                return {
                  name: `${capitalize(x)}\n${d.label}`,
                  title: `${capitalize(x)}\n${d.label}`,
                  value: value,
                  total: value,
                  order: di,
                  color: colors[di],
                  stack: x,
                };
              });
            }

            // show current feasible value
            if (selectedDriver && !showDriversBreakdownValue) {
              stack = driverOptionsDropdown
                .filter((d) => d.value === selectedDriver)
                .map((d, di) => {
                  let value = 0;
                  // Calculate focus commodity
                  if (d.type === "focus") {
                    const answer = selectedSegmentData.answers
                      .filter((a) => a.commodityFocus && a.name === x)
                      .find((a) => a.questionId === d.value);
                    value = answer && answer.value ? answer.value : 0;
                  }
                  // diversified
                  if (d.type === "diversified" && d.value === "diversified") {
                    value =
                      selectedSegmentData?.[`total_${x}_diversified_income`] ||
                      0;
                  }
                  value = value ? parseFloat(value.toFixed(2)) : value;
                  return {
                    name: `${capitalize(x)}\n${d.label}`,
                    title: `${capitalize(x)}\n${d.label}`,
                    value: value,
                    total: value,
                    order: di,
                    color: colors[di],
                    stack: x,
                  };
                });
            }

            // show value with breakdown
            if (selectedDriver && showDriversBreakdownValue) {
              const findDriver = driverOptionsDropdown.find(
                (d) => d.value === selectedDriver
              );
              if (findDriver.type === "focus") {
                stack = findDriver.childrens.map((d, di) => {
                  const answer = selectedSegmentData.answers
                    .filter((a) => a.commodityFocus && a.name === x)
                    .find((a) => a.questionId === d.id);
                  const value =
                    answer && answer.value
                      ? parseFloat(answer.value.toFixed(2))
                      : 0;
                  return {
                    name: `${capitalize(x)}\n${d.text}`,
                    title: `${capitalize(x)}\n${d.text}`,
                    value: value,
                    total: value,
                    order: di,
                    color: colors[di],
                    stack: x,
                  };
                });
                // childrens doesn't have value / answers
                const check = stack.filter((x) => x.value);
                if (!check.length) {
                  const parentAnswer = selectedSegmentData.answers
                    .filter((a) => a.commodityFocus && a.name === x)
                    .find((a) => a.questionId === findDriver.value);
                  const value =
                    parentAnswer && parentAnswer.value
                      ? parseFloat(parentAnswer.value.toFixed(2))
                      : 0;
                  stack = [
                    {
                      name: `${capitalize(x)}\n${findDriver.label}`,
                      title: `${capitalize(x)}\n${findDriver.label}`,
                      value: value,
                      total: value,
                      order: 0,
                      color: colors[0],
                      stack: x,
                    },
                  ];
                }
              }
              if (findDriver.type === "diversified") {
                stack = findDriver.childrens.map((d, di) => {
                  let value = 0;
                  // Calculate others commodity
                  if (otherCommodities.includes(d.type)) {
                    const nonFocusCommodity = selectedSegmentData.answers.find(
                      (a) =>
                        a.name === x &&
                        a.commodityType === d.type &&
                        !a.question.parent &&
                        a.question.question_type !== "diversified"
                    );
                    value =
                      nonFocusCommodity && nonFocusCommodity?.value
                        ? parseFloat(nonFocusCommodity.value.toFixed(2))
                        : 0;
                  }
                  // Calculate diversified
                  if (d.type === "diversified") {
                    const diversified = selectedSegmentData.answers.find(
                      (a) =>
                        a.name === x &&
                        a.commodityType === d.type &&
                        a.questionId === d.id
                    );
                    value =
                      diversified && diversified?.value
                        ? parseFloat(diversified.value.toFixed(2))
                        : 0;
                  }
                  return {
                    name: `${capitalize(x)}\n${d.text}`,
                    title: `${capitalize(x)}\n${d.text}`,
                    value: value,
                    total: value,
                    order: di,
                    color: colors[di],
                    stack: x,
                  };
                });
              }
            }
            // stack bar chart
            return {
              segment: selectedSegmentData.name,
              name: title,
              title: title,
              stack: stack,
            };
          })
          .flatMap((x) => x.stack.map((s) => ({ ...s, segment: x.segment })));
        const groupedData = groupBy(data, "name");
        const transformGroupedData = Object.entries(groupedData).map(
          ([key, value]) => {
            const singleValue = value[0];
            return {
              key: snakeCase(key),
              name: key,
              type: "bar",
              stack: singleValue?.stack,
              color: singleValue?.color,
              data: value.map((val) => ({
                name: val.segment,
                value: val.value || val.total,
              })),
            };
          }
        );
        return transformGroupedData;
      })
      .flatMap((x) => x);
    setLoading(false);
    return res;
  }, [dashboardData, driverOptionsDropdown, selectedDriver]);

  const chartGrid = (selectedDriver) => {
    switch (selectedDriver) {
      case 2: // land
        return {
          right: showDriversBreakdownValue ? 115 : 80,
          left: 65,
          bottom: 20,
        };
      case 3: // volume
        return {
          right: showDriversBreakdownValue ? 115 : 80,
          left: 45,
          bottom: 20,
        };
      case 4: // price
        return {
          right: showDriversBreakdownValue ? 200 : 80,
          left: 55,
          bottom: 20,
        };
      case 5: // cost of production
        return {
          right: showDriversBreakdownValue ? 215 : 140,
          left: 45,
          bottom: 20,
        };
      default: // diversified income
        return {
          right: showDriversBreakdownValue ? 200 : 140,
          left: 55,
          bottom: 20,
        };
    }
  };

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper
            title="Explore income drivers across segments"
            bordered
            showLabel={showLabel}
            setShowLabel={setShowLabel}
            exportElementRef={chartBreakdownDriverRef}
            exportFilename="Explore income drivers across segments"
          >
            <Row gutter={[20, 20]}>
              <Col span={24}>
                <IncomeDriversDropdown
                  selectedSegmentData={
                    dashboardData.length ? dashboardData[0] : null
                  }
                  selectedDriver={selectedDriver}
                  setSelectedDriver={setSelectedDriver}
                  setAxisTitle={setAxisTitle}
                  driverOptionsDropdown={driverOptionsDropdown}
                />
              </Col>
              <Col span={24}>
                <Chart
                  wrapper={false}
                  type="BAR"
                  loading={loading}
                  override={getColumnStackBarOptions({
                    series: chartData,
                    origin: dashboardData,
                    yAxis: { name: axisTitle },
                    grid: chartGrid(selectedDriver),
                    showLabel: showLabel,
                  })}
                  height={showDriversBreakdownValue ? 600 : 450}
                />
              </Col>
            </Row>
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              Explore income drivers across segments
            </div>
            <div className="section-description">
              This graph lets you explore and compare income drivers across
              segments, showing their current values and the gaps to feasible
              levels. It helps you spot differences and identify where progress
              is possible.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartIncomeDriverAcrossSegments;
