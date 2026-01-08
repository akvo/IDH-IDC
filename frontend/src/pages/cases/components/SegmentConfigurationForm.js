import React, { useMemo } from "react";
import { Form, Radio, Select, InputNumber, Row, Col } from "antd";
import { selectProps } from "../../../lib";

const SegmentConfigurationForm = ({
  uploadResult = {},
  dataUploadFieldPreffix = "",
}) => {
  const form = Form.useFormInstance();

  const variableType = Form.useWatch(
    `${dataUploadFieldPreffix}variable_type`,
    form
  );

  const segmentationVariableDropdownValue = useMemo(() => {
    const dataColumns = uploadResult?.columns || {};
    if (!variableType || !dataColumns?.[variableType]) {
      return [];
    }
    return dataColumns[variableType].map((col) => ({ label: col, value: col }));
  }, [uploadResult, variableType]);

  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Form.Item
          name={`${dataUploadFieldPreffix}variable_type`}
          label="Variable Type"
          required
        >
          <Radio.Group>
            <Radio value="categorical">Categorical</Radio>
            <Radio value="numerical">Numerical</Radio>
          </Radio.Group>
        </Form.Item>
      </Col>
      <Col span={10}>
        <Form.Item
          name={`${dataUploadFieldPreffix}segmentation_variable`}
          label="Segmentation Variable"
          required
        >
          <Select
            {...selectProps}
            placeholder="Select segmentation variable"
            options={segmentationVariableDropdownValue}
          />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item
          name={`${dataUploadFieldPreffix}number_of_segments`}
          label="Number of Segments"
          required
        >
          <InputNumber
            min={1}
            max={5}
            style={{ width: "100%" }}
            placeholder="e.g. 3"
          />
          <small>Max 5 segments allowed.</small>
        </Form.Item>
      </Col>
    </Row>
  );
};

export default SegmentConfigurationForm;
