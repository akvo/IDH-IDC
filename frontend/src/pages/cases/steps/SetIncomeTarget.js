import React from "react";
import { Form, Radio, Row, Col, InputNumber, Select, Card, Space } from "antd";
import { CurrentCaseState } from "../store";
import { yesNoOptions } from "../../../store/static";
import { InputNumberThousandFormatter } from "../../../lib";

const formStyle = { width: "100%" };

const SetIncomeTarget = (/* { segment } */) => {
  const [form] = Form.useForm();
  const currentCase = CurrentCaseState.useState((s) => s);

  const setTargetYourself = Form.useWatch("set_target_yourself", form);

  const preventNegativeValue = (fieldName) => [
    () => ({
      validator(_, value) {
        if (value >= 0) {
          return Promise.resolve();
        }
        form.setFieldValue(fieldName, null);
        return Promise.reject(new Error("Negative value not allowed"));
      },
    }),
  ];

  const renderTargetInput = (key) => {
    switch (key) {
      case 1:
        return (
          <Col span={24}>
            <Form.Item
              name="target"
              label="Target"
              rules={[
                {
                  required: true,
                  message: "Income target required.",
                },
              ]}
            >
              <InputNumber
                style={{ width: "40%" }}
                controls={false}
                addonAfter={currentCase.currency}
                {...InputNumberThousandFormatter}
                // disabled={!disableTarget || !enableEditCase}
              />
            </Form.Item>
          </Col>
        );
      case 0:
        return (
          <Col span={24}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Form.Item label="Region" name="region">
                  <Select
                    style={formStyle}
                    // options={regionOptions}
                    // disabled={!disableTarget || !enableEditCase}
                    // loading={loadingRegionOptions}
                    // placeholder={
                    //   regionOptionStatus === 404
                    //     ? "Region not available"
                    //     : "Select or Type Region"
                    // }
                    // {...selectProps}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Average number of adults in the household"
                  name="household_adult"
                  rules={preventNegativeValue("household_adult")}
                >
                  <InputNumber
                    style={formStyle}
                    // onChange={handleOnChangeHouseholdAdult}
                    // disabled={!enableEditCase}
                    controls={false}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Average number of children in the household"
                  name="household_children"
                  rules={preventNegativeValue("household_children")}
                >
                  <InputNumber
                    style={formStyle}
                    // onChange={handleOnChangeHouseholdChild}
                    // disabled={!enableEditCase}
                    controls={false}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Card className="card-income-target-wrapper">
                  <Space size={50}>
                    <div className="income-target-value">
                      4486.00 {currentCase.currency}
                    </div>
                    <div className="income-target-text">
                      Living income benchmark value for a household per year
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={24}>
                <Card className="card-lib-wrapper">
                  <Row align="middle">
                    <Col span={12} className="lib-text">
                      Information about Living Income Benchmark
                    </Col>
                    <Col span={12} align="end" className="lib-source">
                      Source: Living Income Benchmark
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Col>
        );
      default:
        return "";
    }
  };

  return (
    <Form form={form} layout="vertical" autoComplete="off">
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Form.Item
            name="set_target_yourself"
            label="Do you want to set an income target yourself?"
            rules={[
              {
                required: true,
                message: "Please select yes or no",
              },
            ]}
          >
            <Radio.Group options={yesNoOptions} />
          </Form.Item>
        </Col>
        {renderTargetInput(setTargetYourself)}
      </Row>
    </Form>
  );
};

export default SetIncomeTarget;
