import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState } from "../store";
import { Row, Col, Card, Space } from "antd";
import { VisualCardWrapper } from "../components";

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
        <Card className="card-visual-wrapper">
          <Row gutter={[20, 20]} align="middle">
            <Col span={16}>
              <VisualCardWrapper title="Income gap" bordered>
                Chart
              </VisualCardWrapper>
            </Col>
            <Col span={8}>
              <Space direction="vertical">
                <div className="section-title">
                  What is the current income of the farmers and their income
                  gap?
                </div>
                <div className="section-description">
                  This graph helps you explore the composition of household
                  income and identify the gap between current income and the
                  income target. Use it to uncover variations across segments
                  and consider where tailored strategies might be needed.
                </div>
              </Space>
            </Col>
          </Row>
        </Card>
      </Col>
      {/* EOL Chart */}
    </Row>
  );
};

export default UnderstandIncomeGap;
