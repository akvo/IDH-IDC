import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { Row, Col, Card, Space } from "antd";
import {
  // ChartIncomeGap,
  // CompareIncomeGap,
  // ChartIncomeDriverAcrossSegments,
  ChartExploreIncomeDriverBreakdown,
  ChartIncomeLevelsForDifferentCommodities,
  ChartHouseholdIncomeComposition,
  ChartNeededIncomeLevel,
  ChartFarmEconomicEfficiency,
  ChartRevenueToCostRatio,
  ChartNetIncomePerLandUnit,
} from "../visualizations";
import { routePath } from "../../../components/route";

/**
 * STEP 3
 */

// TODO :: When successfully load data from spreadsheet and not update any "Step 2 Enter Income Data"
// the chart's not loaded properly (show's no data), while in step 2 the data already calculated.

const UnderstandIncomeGap = ({
  setbackfunction,
  setnextfunction,
  setsavefunction,
}) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);

  const backFunction = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const nextFunction = useCallback(() => {
    navigate(`${routePath.idc.case}/${currentCase.id}/${stepPath.step4.label}`);
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

      {/* TODO:: DELETE */}
      {/* <Col span={24}>
        <ChartIncomeGap />
      </Col>
      <Col span={24}>
        <CompareIncomeGap />
      </Col> */}
      {/* EOL TODO:: DELETE */}

      {/* TODO:: DELETE */}
      {/* <Col span={24}>
        <Card className="card-section-wrapper">
          Explore your income drivers
        </Card>
      </Col> */}
      {/* <Col span={24}>
        <ChartIncomeDriverAcrossSegments />
      </Col> */}
      {/* EOL TODO:: DELETE */}

      <Col span={24}>
        <ChartExploreIncomeDriverBreakdown />
      </Col>
      <Col span={24}>
        <ChartIncomeLevelsForDifferentCommodities />
      </Col>

      {/* New Chart */}
      <Col span={24}>
        <Card className="card-visual-wrapper">
          <Row gutter={[20, 20]}>
            <Col span={12}>
              <ChartHouseholdIncomeComposition />
            </Col>
            <Col span={12}>
              <ChartNeededIncomeLevel />
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <ChartFarmEconomicEfficiency />
      </Col>

      <Col span={24}>
        <ChartRevenueToCostRatio />
      </Col>

      <Col span={24}>
        <ChartNetIncomePerLandUnit />
      </Col>
    </Row>
  );
};

export default UnderstandIncomeGap;
