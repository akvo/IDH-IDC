import React, { useMemo, useState } from "react";
import { Button, Card, Col, InputNumber, Row, Space } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import AllDriverTreeSelector from "./AllDriverTreeSelector";
import { CaseVisualState, CurrentCaseState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";

const OptimizeIncomeTarget = ({ selectedSegment }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { dashboardData } = CaseVisualState.useState((s) => s);

  const [increaseValues, setIncreaseValues] = useState({
    "percentage-increase-1": null,
    "absolute-increase-1": 0,
    "percentage-increase-2": null,
    "absolute-increase-2": 0,
    "percentage-increase-3": null,
    "absolute-increase-3": 0,
  });

  const currency = currentCase?.currency || "";

  const currentDashboardData = useMemo(() => {
    return dashboardData.find((d) => d.id === selectedSegment);
  }, [selectedSegment]);

  const handleChangeIncreaseValues = ({ index, percentage }) => {
    const percentageField = `percentage-increase-${index}`;
    setIncreaseValues((prev) => ({
      ...prev,
      [percentageField]: percentage,
    }));
  };

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
              <InputNumber
                controls={false}
                value={thousandFormatter(
                  currentDashboardData?.total_current_income || 0,
                  2
                )}
                addonAfter={currency}
                readOnly={true}
              />
            </div>
            <div>
              <label>Feasible income</label>
              <InputNumber
                controls={false}
                value={thousandFormatter(
                  currentDashboardData?.total_feasible_income || 0,
                  2
                )}
                addonAfter={currency}
                readOnly={true}
              />
            </div>
            <div>
              <label>Increase 1</label>
              <InputNumber
                controls={false}
                addonAfter="%"
                onChange={(value) =>
                  handleChangeIncreaseValues({ index: 1, percentage: value })
                }
                value={increaseValues?.["percentage-increase-1"] || null}
              />
              {increaseValues?.["percentage-increase-1"] && (
                <span>increase 1 {currency}</span>
              )}
            </div>
            <div>
              <label>Increase 2</label>
              <InputNumber
                controls={false}
                addonAfter="%"
                onChange={(value) =>
                  handleChangeIncreaseValues({ index: 2, percentage: value })
                }
                value={increaseValues?.["percentage-increase-2"] || null}
              />
              {increaseValues?.["percentage-increase-2"] && (
                <span>increase 2 {currency}</span>
              )}
            </div>
            <div>
              <label>Increase 3</label>
              <InputNumber
                controls={false}
                addonAfter="%"
                onChange={(value) =>
                  handleChangeIncreaseValues({ index: 3, percentage: value })
                }
                value={increaseValues?.["percentage-increase-3"] || null}
              />
              {increaseValues?.["percentage-increase-3"] && (
                <span>increase 3 {currency}</span>
              )}
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
