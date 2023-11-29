import React from "react";
import { Form, Select, Row, Col } from "antd";
import { selectProps } from "./";

const responsiveCol = {
  xs: { span: 24 },
  sm: { span: 24 },
  md: { span: 24 },
  lg: { span: 12 },
  xl: { span: 12 },
};

const AreaUnitFields = ({ disabled = true, index = 0 }) => {
  return (
    <Row gutter={[12, 12]}>
      <Col {...responsiveCol}>
        <Form.Item
          label="Area Unit"
          name={index ? `${index}-area_size_unit` : "area_size_unit"}
          rules={[
            {
              required: !disabled,
              message: "Area Unit is required",
            },
          ]}
        >
          <Select
            disabled={disabled}
            placeholder="Select Area Unit"
            options={[
              {
                label: "Hectares",
                value: "hectares",
              },
              {
                label: "Acres",
                value: "acres",
              },
              {
                label: "Cubic Metres",
                value: "cubic-metres",
              },
              {
                label: "Cubic Feet",
                value: "cubic-feet",
              },
              {
                label: "Cubic Yards",
                value: "cubic-yards",
              },
            ]}
            {...selectProps}
          />
        </Form.Item>
      </Col>
      <Col {...responsiveCol}>
        <Form.Item
          label="Weight Measurement Unit"
          name={
            index
              ? `${index}-volume_measurement_unit`
              : "volume_measurement_unit"
          }
          rules={[
            {
              required: !disabled,
              message: "Measurement Unit is required",
            },
          ]}
        >
          <Select
            placeholder="Select Measurement Unit"
            disabled={disabled}
            options={[
              {
                label: "Kilograms",
                value: "kilograms",
              },
              {
                label: "Grams",
                value: "grams",
              },
              {
                label: "Litres",
                value: "litres",
              },
              {
                label: "Kilolitres",
                value: "kilolitres",
              },
              {
                label: "Barrels",
                value: "barrels",
              },
              {
                label: "Bags",
                value: "bags",
              },
              {
                label: "Tons",
                value: "tons",
              },
            ]}
            {...selectProps}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default AreaUnitFields;
