import React, { useMemo } from "react";
import { Card, Row, Col } from "antd";
import { CaseUIState, CurrentCaseState } from "../store";

const EnterIncomeDataVisual = () => {
  const { activeSegmentId } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);

  const currentSegment = useMemo(
    () =>
      currentCase.segments.find((segment) => segment.id === activeSegmentId) ||
      null,
    [currentCase.segments, activeSegmentId]
  );

  if (!currentSegment) {
    return <div>Failed to load current segment data</div>;
  }

  return (
    <Row gutter={[20, 20]}>
      <Col span={24}>
        <Card>{currentSegment.target}</Card>
      </Col>
      <Col span={24}>
        <Card>Household Income Bar Chart</Card>
      </Col>
      <Col span={24}>
        <Card>Household Income Table</Card>
      </Col>
    </Row>
  );
};

export default EnterIncomeDataVisual;
