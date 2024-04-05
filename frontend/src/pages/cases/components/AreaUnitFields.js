import React from "react";
import { Form, Select, Row, Col } from "antd";
import { selectProps } from "./";
import { areaUnitOptions, volumeUnitOptions } from "../../../store/static";

const responsiveCol = {
  xs: { span: 24 },
  sm: { span: 24 },
  md: { span: 24 },
  lg: { span: 12 },
  xl: { span: 12 },
};

const AreaUnitFields = ({
  disabled = true,
  index = 0,
  disableLandUnitField = false,
}) => {
  return (
    <Row gutter={[12, 12]}>
      <Col {...responsiveCol}>
        <Form.Item
          label="Land Unit"
          name={index ? `${index}-area_size_unit` : "area_size_unit"}
          rules={[
            {
              required: !disabled && !disableLandUnitField,
              message: "Land Unit is required",
            },
          ]}
        >
          <Select
            disabled={disabled || disableLandUnitField}
            placeholder="Select Land Unit"
            options={areaUnitOptions}
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
            options={volumeUnitOptions}
            {...selectProps}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default AreaUnitFields;
