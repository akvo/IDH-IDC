import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState, CaseVisualState } from "../store";
import { Row, Col, Card, Space, Carousel, Form } from "antd";
import {
  ChartBiggestImpactOnIncome,
  ChartMonetaryImpactOnIncome,
} from "../visualizations";
import { BinningDriverForm, SegmentSelector } from "../components";

/**
 * STEP 4
 */
const AssessImpactMitigationStrategies = ({
  setbackfunction,
  setnextfunction,
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const [selectedSegment, setSelectedSegment] = useState(null);

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

      {/* #1 Chart */}
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

      {/* #2 Sensitivity Analysis */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          Which pairs of drivers have a strong impact on income?
        </Card>
      </Col>
      <Col span={24}>
        <Card className="card-content-wrapper">
          <Row gutter={[20, 20]}>
            <Col span={24}>
              <SegmentSelector
                selectedSegment={selectedSegment}
                setSelectedSegment={setSelectedSegment}
              />
            </Col>
            <Col span={24}>
              <Form
                name="sensitivity-analysis"
                layout="vertical"
                form={form}
                // onValuesChange={onValuesChange}
                // initialValues={binningData}
              >
                {dashboardData.map((segment, key) => (
                  <BinningDriverForm
                    key={key}
                    segment={segment}
                    // drivers={drivers.map((x) => {
                    //   return {
                    //     value: x.name,
                    //     label: x.name,
                    //     unitName: x.unitName,
                    //   };
                    // })}
                    // selected={
                    //   binningValues.find((b) => b.id === segment.id)?.selected
                    // }
                    hidden={selectedSegment !== segment.id}
                    // enableEditCase={enableEditCase}
                  />
                ))}
              </Form>
            </Col>
          </Row>
        </Card>
      </Col>
      {/* EOL Sensitivity Analysis */}
    </Row>
  );
};

export default AssessImpactMitigationStrategies;
