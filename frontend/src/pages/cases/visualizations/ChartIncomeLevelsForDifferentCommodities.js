import React, { useState, useMemo, useRef } from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";
import { CaseVisualState, CurrentCaseState } from "../store";
import { SegmentSelector } from "../components";
import Chart from "../../../components/chart";
import { capitalize, uniqBy, sum } from "lodash";

const colors = [
  "#1b726f",
  "#9cc2c1",
  "#4eb8ff",
  "#b7e2ff",
  "#81e4ab",
  "#ddf8e9",
  "#3d4149",
  "#787d87",
];
// const currentColors = ["#1b726f", "#4eb8ff", "#81e4ab", "#3d4149"];
// const feasibleColors = ["#9cc2c1", "#b7e2ff", "#ddf8e9", "#787d87"];

const ChartIncomeLevelsForDifferentCommodities = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showLabel, setShowLabel] = useState(false);
  const chartRef = useRef(null);

  const selectedSegmentData = useMemo(() => {
    if (!selectedSegment || !dashboardData.length) {
      return null;
    }
    return dashboardData.find((d) => d.id === selectedSegment);
  }, [dashboardData, selectedSegment]);

  const chartData = useMemo(() => {
    if (!selectedSegmentData) {
      return [];
    }
    const parentQuestions = selectedSegmentData.answers.filter(
      (a) => !a.question?.parent && a.question?.question_type === "aggregator"
    );
    if (!parentQuestions?.length) {
      return [];
    }
    const parendQuestionIds = parentQuestions.map((pq) => pq.question.id);
    // list commodities exclude diversified income
    const commoditiesTemp = selectedSegmentData.answers
      .filter((a) => {
        const currentCommodity = currentCase.case_commodities.find(
          (c) => c?.id === a.caseCommodityId
        );
        if (
          a.commodityId &&
          a.commodityName &&
          (parendQuestionIds.includes(a.question?.parent) ||
            currentCommodity?.breakdown === false)
        ) {
          return a;
        }
        return false;
      })
      .map((a) => {
        const parentQuestion = parentQuestions.find(
          (pq) =>
            pq.commodityId === a.commodityId &&
            pq.commodityType === a.commodityType
        )?.question;
        return {
          commodityId: a.commodityId,
          commodityName: a.commodityName,
          commodityFocus: a.commodityFocus,
          questions: parentQuestion
            ? parentQuestion.childrens.map((q) => ({
                id: q.id,
                text: q.text,
              }))
            : [],
        };
      });
    const commodities = uniqBy(commoditiesTemp, "commodityId");
    // populate chart data
    const currentCommodityValuesExceptFocus = [];
    const feasibleCommodityValuesExceptFocus = [];
    const res = commodities.map((cm, cmi) => {
      const data = ["current", "feasible"].map((x, xi) => {
        // const colors = x === "current" ? currentColors : feasibleColors;
        const title = `${capitalize(x)} ${selectedSegmentData.name}`;
        // recalculate total value
        const incomeQuestion = selectedSegmentData.answers.find(
          (a) =>
            a.name === x &&
            a.commodityId === cm.commodityId &&
            !a.question.parent &&
            a.question.question_type !== "diversified"
        );
        const newTotalValue =
          incomeQuestion && incomeQuestion?.value
            ? Math.round(incomeQuestion.value)
            : 0;
        // add newTotalValue to temp variable for diversified value calculation
        if (x === "current" && !cm.commodityFocus) {
          currentCommodityValuesExceptFocus.push(newTotalValue);
        }
        if (x === "feasible" && !cm.commodityFocus) {
          feasibleCommodityValuesExceptFocus.push(newTotalValue);
        }
        // map drivers value
        const stack = cm.questions.map((q, qi) => {
          const answer = selectedSegmentData.answers.find(
            (a) =>
              a.commodityId === cm.commodityId &&
              a.name === x &&
              a.questionId === q.id
          );
          const value = answer && answer.value ? Math.round(answer.value) : 0;
          return {
            name: q.text,
            title: q.text,
            value: value,
            total: value,
            order: qi,
            color: colors[qi],
          };
        });
        return {
          name: title,
          title: title,
          stack: stack,
          value: newTotalValue,
          total: newTotalValue,
          commodityId: cm.commodityId,
          commodityName: cm.commodityName,
          color: colors[xi],
        };
      });
      return {
        name: cm.commodityName,
        title: cm.commodityName,
        order: cmi,
        data: data,
      };
    });

    // DIVERSIFIED CALCULATION - add diversified income value
    let diversifiedQUestions = selectedSegmentData.answers
      .filter(
        (a) =>
          (!a.commodityId || !a.commodityName) &&
          a.question.question_type === "diversified" &&
          !a.question.parent
      )
      .flatMap((a) => a.question);
    diversifiedQUestions = uniqBy(diversifiedQUestions, "id");
    // populate diversified income value
    const diversifiedData = ["current", "feasible"].map((x, xi) => {
      // const colors = x === "current" ? currentColors : feasibleColors;
      const title = `${capitalize(x)} ${selectedSegmentData.name}`;
      let newValue = 0;
      if (x === "current") {
        newValue =
          selectedSegmentData.total_current_diversified_income -
          sum(currentCommodityValuesExceptFocus);
      }
      if (x === "feasible") {
        newValue =
          selectedSegmentData.total_feasible_diversified_income -
          sum(feasibleCommodityValuesExceptFocus);
      }
      newValue = Math.round(newValue);
      const stack = diversifiedQUestions.map((q, qi) => {
        const answer = selectedSegmentData.answers.find(
          (a) =>
            (!a.commodityId || !a.commodityName) &&
            a.name === x &&
            a.questionId === q.id
        );
        const value = answer && answer.value ? Math.round(answer.value) : 0;
        return {
          name: q.text,
          title: q.text,
          value: value,
          total: value,
          order: qi,
          color: colors[qi],
        };
      });
      return {
        name: title,
        title: title,
        stack: stack,
        value: newValue,
        total: newValue,
        commodityId: null,
        commodityName: null,
        color: colors[xi],
      };
    });
    res.push({
      name: "Other diversified income",
      title: "Other diversified income",
      order: res.length,
      data: diversifiedData,
    });
    return res;
  }, [selectedSegmentData, currentCase]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper
            title="Income levels for different commodities"
            bordered
            showLabel={showLabel}
            setShowLabel={setShowLabel}
            exportElementRef={chartRef}
            exportFilename="Explore income levels for different commodities"
          >
            <Row gutter={[20, 20]} align="middle">
              <Col span={24}>
                <SegmentSelector
                  selectedSegment={selectedSegment}
                  setSelectedSegment={setSelectedSegment}
                />
              </Col>
              <Col span={24}>
                <Chart
                  wrapper={false}
                  type="COLUMN-BAR"
                  data={chartData}
                  affix={true}
                  extra={{
                    axisTitle: {
                      y: `Income Levels (${currentCase.currency})`,
                    },
                  }}
                  showLabel={showLabel}
                />
              </Col>
            </Row>
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              Explore income levels for different commodities
            </div>
            <div className="section-description">
              This graph shows the current net income levels for your focus
              commodity, any secondary or tertiary commodities, next to
              diversified income within different segments. Use it to compare
              income levels across sources and segments.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartIncomeLevelsForDifferentCommodities;
