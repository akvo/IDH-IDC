import React, { useMemo } from "react";
import { Card, Row, Col, Space, Tag } from "antd";
import { CaseUIState, CurrentCaseState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";
import ChartCalculatedHouseholdIncome from "./ChartCalculatedHouseholdIncome";
import ExploreDataFromOtherStudiesTable from "./ExploreDataFromOtherStudiesTable";

const EnterIncomeDataVisual = () => {
  const { activeSegmentId } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);

  const currentSegment = useMemo(() => {
    const findCase = currentCase.segments.find(
      (segment) => segment.id === activeSegmentId
    );
    if (!findCase) {
      return currentCase.segments?.[0] || null;
    }
    return findCase;
  }, [currentCase.segments, activeSegmentId]);

  if (!currentSegment) {
    return <Tag color="error">Failed to load current segment data</Tag>;
  }

  return (
    <Row gutter={[20, 20]} className="income-data-visual-container">
      <Col span={24}>
        <Card className="income-target-wrapper">
          <div className="label">Living income benchmark for a household</div>
          <Space align="center">
            <div className="value">
              {thousandFormatter(currentSegment.target, 2)}
            </div>
            <div className="label"> / year</div>
          </Space>
        </Card>
      </Col>
      <Col span={24}>
        <ChartCalculatedHouseholdIncome />
      </Col>
      <Col span={24}>
        <ExploreDataFromOtherStudiesTable />
      </Col>
    </Row>
  );
};

export default EnterIncomeDataVisual;
