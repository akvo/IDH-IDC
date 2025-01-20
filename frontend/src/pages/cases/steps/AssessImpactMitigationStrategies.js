import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { Row, Col, Card, Space, Carousel } from "antd";
import {
  ChartBiggestImpactOnIncome,
  ChartMonetaryImpactOnIncome,
} from "../visualizations";

/**
 * STEP 4
 */
const AssessImpactMitigationStrategies = ({
  setbackfunction,
  setnextfunction,
}) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);

  const backFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step3.label}`);
  }, [navigate, currentCase.id]);

  const nextFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step5.label}`);
  }, [navigate, currentCase.id]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
  }, [setbackfunction, setnextfunction, backFunction, nextFunction]);

  return (
    <Row id="assess-impact-mitigation-strategies" gutter={[24, 24]}>
      <Col span={24} className="header-wrapper">
        <Space direction="vertical">
          <div className="title">Explanatory text</div>
          <div className="description">
            This page enables you to explore various scenarios by adjusting your
            income drivers in different ways across your segments. This allows
            you to understand the potential paths towards improving farmer
            household income
          </div>
        </Space>
      </Col>
      <Col span={24}>
        <Card className="card-section-wrapper">
          Which drivers have the highest impact on income change?
        </Card>
      </Col>
      {/* Carousel */}
      <Col span={24}>
        <Carousel autoplay>
          <div>
            <ChartBiggestImpactOnIncome />
          </div>
          <div>
            <ChartMonetaryImpactOnIncome />
          </div>
        </Carousel>
      </Col>
      {/* EOL Carousel */}
    </Row>
  );
};

export default AssessImpactMitigationStrategies;
