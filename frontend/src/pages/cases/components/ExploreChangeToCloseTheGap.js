import React, { useMemo, useState, useEffect } from "react";
import { CurrentCaseState, CaseVisualState, CaseUIState } from "../store";
import { Row, Col, Card, Space, InputNumber } from "antd";
import {
  SegmentSelector,
  SingleDriverChange,
  TwoDriverHeatmap,
} from "../components";
import { thousandFormatter } from "../../../components/chart/options/common";

const ExploreChangeToCloseTheGap = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { sensitivityAnalysis, prevSensitivityAnalysis, dashboardData } =
    CaseVisualState.useState((s) => s);
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const [selectedSegment, setSelectedSegment] = useState(null);
  const [adjustedGoal, setAdjustedGoal] = useState(0);

  const handleOnSaveAdjustedGoal = ({ updatedValue = {} }) => {
    CaseVisualState.update((s) => ({
      ...s,
      sensitivityAnalysis: {
        ...s.sensitivityAnalysis,
        config: {
          ...s.sensitivityAnalysis.config,
          ...adjustedValues,
          ...updatedValue,
        },
      },
    }));
  };

  console.log(sensitivityAnalysis?.config, "config");
  const currentDashboardData = useMemo(() => {
    const curr = dashboardData?.find((d) => d.id === selectedSegment);
    setAdjustedGoal(curr?.target || 0);
    return curr;
  }, [dashboardData, selectedSegment]);

  const handleOnCloseGapChange = (value) => {
    const originalTarget = currentDashboardData?.target || 0;
    const currentIncome = currentDashboardData?.total_current_income || 0;
    const incomeGap = originalTarget - currentIncome;

    const percentToCloseByField = value;

    const newTarget = currentIncome + incomeGap * (percentToCloseByField / 100);
    setAdjustedGoal(newTarget);
  };

  return (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Card className="card-content-wrapper select-the-goal-container">
          <Row gutter={[20, 20]}>
            <Col span={24}>
              <h3>Select the Goal:</h3>
              <p>
                Closing the income gap may not be fully achievable within your
                feasible levels. Choose the percentage of the gap you would like
                to close and test different scenarios. The newly chosen target
                will be applied to all the calculations within the explore
                section of this step.
              </p>
            </Col>
            <Col span={24}>
              <Row gutter={[20, 20]}>
                <Col span={16}>
                  <p>Select the segment for which you want to explore.</p>
                  <SegmentSelector
                    selectedSegment={selectedSegment}
                    setSelectedSegment={setSelectedSegment}
                  />
                </Col>
                <Col span={8}>
                  <Space direction="vertical" size={2}>
                    <p>The income gap to be closed by:</p>
                    <InputNumber
                      controls={false}
                      addonAfter="%"
                      onChange={handleOnCloseGapChange}
                      disabled={!enableEditCase}
                    />
                    <p className="new-target-text">
                      New target: {`${thousandFormatter(adjustedGoal, 2)}`}{" "}
                      {`${currentCase?.currency}`}
                    </p>
                  </Space>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <SingleDriverChange selectedSegment={selectedSegment} />
      </Col>

      <Col span={24}>
        <TwoDriverHeatmap selectedSegment={selectedSegment} />
      </Col>
    </Row>
  );
};

export default ExploreChangeToCloseTheGap;
