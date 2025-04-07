import React from "react";
import { Form, Tooltip, Input, InputNumber } from "antd";
import { QuestionCircleOutline } from "../../lib/icon";

const disabledInputProps = {
  style: {
    width: 135,
  },
  className: "disabled-field",
};
const numberProps = {
  controls: false,
  style: {
    width: 135,
  },
};

const NewCpiForm = () => {
  return (
    <>
      <p>
        <a
          href="https://tradingeconomics.com/country-list/consumer-price-index-cpi"
          target="_blank"
          rel="noreferrer noopener"
        >
          Find consumer price index (CPI)
        </a>{" "}
        <Tooltip title="Find the CPI value for the year you want to calculate a benchmark value for.">
          <span>
            <QuestionCircleOutline size={14} />
          </span>
        </Tooltip>
      </p>
      <div className="step-form-item-wrapper">
        <Form.Item label="Insert the CPI value" name="new_cpi">
          <InputNumber {...numberProps} />
        </Form.Item>
        <Form.Item label="Inflation rate" name="new_inflation_rate">
          <Input {...disabledInputProps} disabled />
        </Form.Item>
        <Form.Item
          label="Adjusted benchmark value for a household/year"
          name="new_adjusted_benchmark_value"
        >
          <Input {...disabledInputProps} disabled />
        </Form.Item>
      </div>
    </>
  );
};

export default NewCpiForm;
