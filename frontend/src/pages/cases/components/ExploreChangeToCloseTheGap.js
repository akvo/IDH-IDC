import React, { useState } from "react";
import { Row, Col, Card } from "antd";
import {
  SegmentSelector,
  SingleDriverChange,
  TwoDriverHeatmap,
  AdjustIncomeTarget,
} from "../components";

const ExploreChangeToCloseTheGap = () => {
  const [selectedSegment, setSelectedSegment] = useState(null);

  return (
    <Row gutter={[24, 24]}>
      <Col span={24}>
        <Card className="card-content-wrapper select-the-goal-container">
          <Row gutter={[20, 20]} align="bottom">
            <Col span={24}>
              <Row gutter={[20, 20]}>
                <Col span={16}>
                  <h4>Select the segment for which you want to explore.</h4>
                  <SegmentSelector
                    selectedSegment={selectedSegment}
                    setSelectedSegment={setSelectedSegment}
                  />
                </Col>
              </Row>
            </Col>
            <Col span={16}>
              <h3>Select the Goal:</h3>
              <p>
                Closing the income gap may not be fully achievable within your
                feasible levels. Choose the percentage of the gap you would like
                to close and test different scenarios. The newly chosen target
                will be applied to all the calculations within the explore
                section of this step.
              </p>
            </Col>
            <Col span={8}>
              <AdjustIncomeTarget
                selectedSegment={selectedSegment}
                buttonView={true}
              />
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
