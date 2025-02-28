import React from "react";
import { Button, Card, Col, InputNumber, Row, Space } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import AllDriverTreeSelector from "./AllDriverTreeSelector";

const OptimizeIncomeTarget = ({ selectedSegment }) => {
  return (
    <Card className="card-section-wrapper optimize-income-target-wrapper">
      <Row gutter={[20, 20]}>
        <Col span={24}>
          <div className="title">
            What is the best way to increase income within feasible ranges?
          </div>
          <div className="description">
            Below we provide an optimisation model that helps you determine the
            most effective way to increase income by adjusting key income
            drivers while keeping changes within feasible limits.
          </div>
        </Col>
        <Col span={24} className="optimize-income-target-step-wrapper">
          <Space className="step-wrapper" align="center">
            <div className="number">1.</div>
            <div className="label">Select the drivers you can influence</div>
          </Space>
          <div className="description">You can enter up to 3 scenario’s.</div>
          <div>
            <AllDriverTreeSelector
              multiple={true}
              maxLength={3}
              style={{ width: "45%" }}
              dropdownStyle={{ width: "60%" }}
            />
          </div>
        </Col>
        <Col span={24} className="optimize-income-target-step-wrapper">
          <Space className="step-wrapper" align="center">
            <div className="number">2.</div>
            <div className="label">
              Set your improved income by choosing a percentage increase in
              current income to close the feasible income gap
            </div>
          </Space>
          <div className="income-inputs-wrapper">
            <div>
              <label>Current income</label>
              <InputNumber controls={false} />
            </div>
            <div>
              <label>Feasible income</label>
              <InputNumber controls={false} />
            </div>
            <div>
              <label>Increase 1</label>
              <InputNumber controls={false} addonAfter="%" />
              <span>increase 1 value</span>
            </div>
            <div>
              <label>Increase 2</label>
              <InputNumber controls={false} addonAfter="%" />
              <span>increase 2 value</span>
            </div>
            <div>
              <label>Increase 3</label>
              <InputNumber controls={false} addonAfter="%" />
              <span>increase 3 value</span>
            </div>
          </div>
        </Col>
        <Col span={24} className="optimize-button-wrapper">
          <Button className="button-clear-optimize-result">
            Clear results
          </Button>
          <Button className="button-run-the-model">
            Run the model <ArrowRightOutlined />
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default OptimizeIncomeTarget;
