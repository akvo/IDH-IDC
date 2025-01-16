import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { Row, Col, Card, Space } from "antd";
import {
  ChartIncomeGap,
  CompareIncomeGap,
  ChartIncomeDriverAcrossSegments,
} from "../visuals";

/**
 * STEP 3
 */
const UnderstandIncomeGap = ({ setbackfunction, setnextfunction }) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);

  const backFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step2.label}`);
  }, [navigate, currentCase.id]);

  const nextFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step4.label}`);
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
    <Row id="understand-income-gap" gutter={[24, 24]}>
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
          Understand current income and the income gap
        </Card>
      </Col>
      {/* Chart */}
      <Col span={24}>
        <ChartIncomeGap />
      </Col>
      <Col span={24}>
        <CompareIncomeGap />
      </Col>
      <Col span={24}>
        <ChartIncomeDriverAcrossSegments />
      </Col>
      {/* EOL Chart */}
    </Row>
  );
};

export default UnderstandIncomeGap;
