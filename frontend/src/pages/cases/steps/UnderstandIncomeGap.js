import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { Row, Col, Card, Space } from "antd";
import {
  ChartIncomeGap,
  CompareIncomeGap,
  ChartIncomeDriverAcrossSegments,
  ChartExploreIncomeDriverBreakdown,
  ChartIncomeLevelsForDifferentCommodities,
} from "../visualizations";

/**
 * STEP 3
 */
const UnderstandIncomeGap = ({
  setbackfunction,
  setnextfunction,
  setsavefunction,
}) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);

  const backFunction = useCallback(() => {
    navigate(-1);
    // navigate(`/case/${currentCase.id}/${stepPath.step2.label}`);
  }, [navigate]);

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
    if (setsavefunction) {
      setsavefunction(() => console.info("no save function needed"));
    }
  }, [
    setbackfunction,
    setnextfunction,
    setsavefunction,
    backFunction,
    nextFunction,
  ]);

  return (
    <Row id="understand-income-gap" gutter={[24, 24]}>
      <Col span={24} className="header-wrapper">
        <Space direction="vertical">
          <div className="title">What is the current income situation?</div>
          <div className="description">
            This page provides an overview of the current income situation of
            farmers across various segments, offering insights into the living
            income gap. It also enables a detailed exploration of the
            composition of income drivers, helping you better understand their
            contributions.
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
      {/* EOL Chart */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Explore your income drivers
        </Card>
      </Col>
      {/* Chart */}
      <Col span={24}>
        <ChartIncomeDriverAcrossSegments />
      </Col>
      <Col span={24}>
        <ChartExploreIncomeDriverBreakdown />
      </Col>
      <Col span={24}>
        <ChartIncomeLevelsForDifferentCommodities />
      </Col>
      {/* EOL Chart */}
    </Row>
  );
};

export default UnderstandIncomeGap;
