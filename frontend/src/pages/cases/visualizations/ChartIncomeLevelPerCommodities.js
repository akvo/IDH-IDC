import React, { useState, useEffect, useMemo } from "react";
import { Row, Col } from "antd";
import { SegmentSelector } from ".";
import { uniqBy, capitalize, sum } from "lodash";
import Chart from "../../../components/chart";

const colors = ["#00625F", "#47D985", "#82B2B2"];
const legendColors = ["#00625F", "#47D985", "#82B2B2"];

const ChartIncomeLevelPerCommodities = ({ dashboardData, currentCase }) => {
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (dashboardData.length > 0) {
      setSelectedSegment(dashboardData[0].id);
    }
  }, [dashboardData]);

  const currentSegmentData = useMemo(() => {
    if (!selectedSegment || !dashboardData.length) {
      return null;
    }
    return dashboardData.find(
      (d) => d.id === selectedSegment || d.currentSegment === selectedSegment
    );
  }, [selectedSegment, dashboardData]);

  const chartData = useMemo(() => {
    if (!currentSegmentData) {
      return [];
    }
    let parentQuestion = currentSegmentData.answers.find(
      (a) => !a.question.parent
    );
    if (!parentQuestion && !parentQuestion?.question) {
      return [];
    }
    parentQuestion = parentQuestion.question;
    // list commodities exclude diversified income
    const commoditiesTemp = currentSegmentData.answers
      .filter(
        (a) =>
          a.commodityId &&
          a.commodityName &&
          a.question.parent === parentQuestion.id
      )
      .map((a) => ({
        commodityId: a.commodityId,
        commodityName: a.commodityName,
        commodityFocus: a.commodityFocus,
        questions: parentQuestion.childrens.map((q) => ({
          id: q.id,
          text: q.text,
        })),
      }));
    const commodities = uniqBy(commoditiesTemp, "commodityId");
    // populate chart data
    const currentCommodityValuesExceptFocus = [];
    const feasibleCommodityValuesExceptFocus = [];
    const res = commodities.map((cm, cmi) => {
      const data = ["current", "feasible"].map((x, xi) => {
        const title = `${capitalize(x)} ${currentSegmentData.name}`;
        // recalculate total value
        const incomeQuestion = currentSegmentData.answers.find(
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
          const answer = currentSegmentData.answers.find(
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
          color: legendColors[xi],
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
    let diversifiedQUestions = currentSegmentData.answers
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
      const title = `${capitalize(x)} ${currentSegmentData.name}`;
      let newValue = 0;
      if (x === "current") {
        newValue =
          currentSegmentData.total_current_diversified_income -
          sum(currentCommodityValuesExceptFocus);
      }
      if (x === "feasible") {
        newValue =
          currentSegmentData.total_feasible_diversified_income -
          sum(feasibleCommodityValuesExceptFocus);
      }
      newValue = Math.round(newValue);
      const stack = diversifiedQUestions.map((q, qi) => {
        const answer = currentSegmentData.answers.find(
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
        color: legendColors[xi],
      };
    });
    res.push({
      name: "Diversified Income",
      title: "Diversified Income",
      order: res.length,
      data: diversifiedData,
    });
    return res;
  }, [currentSegmentData]);

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <SegmentSelector
            dashboardData={dashboardData}
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
              axisTitle: { y: `Income  Levels (${currentCase.currency})` },
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ChartIncomeLevelPerCommodities;
