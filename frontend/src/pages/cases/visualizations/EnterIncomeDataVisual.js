import React, { useMemo } from "react";
import { Card, Row, Col, Space, Tag } from "antd";
import { CaseUIState, CurrentCaseState, CaseVisualState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";

const EnterIncomeDataVisual = () => {
  const { activeSegmentId } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);
  const totalIncomeQuestions = CaseVisualState.useState(
    (s) => s.totalIncomeQuestions
  );

  const currentSegment = useMemo(
    () =>
      currentCase.segments.find((segment) => segment.id === activeSegmentId) ||
      null,
    [currentCase.segments, activeSegmentId]
  );

  const chartData = useMemo(() => {
    if (!currentCase.segments.length) {
      return [];
    }
    const res = currentCase.segments.map((item) => {
      const answers = item.answers || {};
      const current = totalIncomeQuestions
        .map((qs) => answers?.[`current-${qs}`] || 0)
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      const feasible = totalIncomeQuestions
        .map((qs) => answers?.[`feasible-${qs}`] || 0)
        .filter((a) => a)
        .reduce((acc, a) => acc + a, 0);
      return {
        name: item.name,
        data: [
          {
            name: "Current Income",
            value: Math.round(current),
            color: "#03625f",
          },
          {
            name: "Feasible Income",
            value: Math.round(feasible),
            color: "#82b2b2",
          },
        ],
      };
    });
    return res;
  }, [totalIncomeQuestions, currentCase.segments]);

  if (!currentSegment) {
    return <Tag color="error">Failed to load current segment data</Tag>;
  }

  return (
    <Row gutter={[20, 20]} className="income-data-visual-container">
      <Col span={24}>
        <Card className="income-target-wrapper">
          <Space direction="vertical">
            <div className="label">Living income benchmark for a household</div>
            <Space align="center">
              <div className="value">
                {thousandFormatter(currentSegment.target, 2)}
              </div>
              <div className="label"> / year</div>
            </Space>
          </Space>
        </Card>
      </Col>
      <Col span={24}>
        <VisualCardWrapper title="Household Income">
          <Chart
            wrapper={false}
            type="COLUMN-BAR"
            data={chartData}
            loading={!chartData.length}
            height={window.innerHeight * 0.4}
            extra={{
              axisTitle: { y: `Income (${currentCase.currency})` },
            }}
            grid={{ bottom: 60, right: 5, left: 90 }}
            // showLabel={showChartLabel}
          />
        </VisualCardWrapper>
      </Col>
      <Col span={24}>
        <VisualCardWrapper title="Household Income">
          Household Income Table
        </VisualCardWrapper>
      </Col>
    </Row>
  );
};

export default EnterIncomeDataVisual;
