import React, { useEffect, useMemo, useState } from "react";
import { Form, Radio, Select, InputNumber, Row, Col, Spin, Space } from "antd";
import { selectProps } from "../../../lib";
import { api } from "../../../lib";
import { SegmentForm } from ".";

const SegmentConfigurationForm = ({
  uploadResult = {},
  dataUploadFieldPreffix = "",
  deletedSegmentIds,
  setDeletedSegmentIds,
}) => {
  const form = Form.useFormInstance();

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [segmentationPreviews, setSegmentationPreviews] = useState(null);

  const variableType = Form.useWatch(
    `${dataUploadFieldPreffix}variable_type`,
    form
  );
  const segmentationVariable = Form.useWatch(
    `${dataUploadFieldPreffix}segmentation_variable`,
    form
  );
  const numberOfSegments = Form.useWatch(
    `${dataUploadFieldPreffix}number_of_segments`,
    form
  );

  const segmentationVariableDropdownValue = useMemo(() => {
    const dataColumns = uploadResult?.columns || {};
    if (!variableType || !dataColumns?.[variableType]) {
      return [];
    }
    return dataColumns[variableType].map((col) => ({ label: col, value: col }));
  }, [uploadResult, variableType]);

  useEffect(() => {
    const allowFetchPreview =
      variableType === "numerical"
        ? [variableType, segmentationVariable, numberOfSegments]
        : [variableType, segmentationVariable];

    if (allowFetchPreview.every((val) => val) && uploadResult?.import_id) {
      // fetch segment preview endpoint here
      setLoadingPreview(true);
      const payload = {
        import_id: uploadResult.import_id,
        variable_type: variableType,
        segmentation_variable: segmentationVariable,
        number_of_segments: numberOfSegments ? numberOfSegments : 0,
      };
      api
        .post("/case-import/segmentation-preview", payload)
        .then((res) => {
          setSegmentationPreviews(res.data);
          // set segment values to form initialValue here
          form.setFieldsValue({ segments: res.data.segments || [] });
        })
        .catch((e) => {
          console.error("Error fetching segmentation preview:", e);
        })
        .finally(() => {
          setLoadingPreview(false);
        });
    }
  }, [
    form,
    variableType,
    segmentationVariable,
    numberOfSegments,
    uploadResult.import_id,
  ]);

  const handleChangeVariableType = () => {
    // reset segmentation variable when variable type changes
    form.setFieldsValue({
      [`${dataUploadFieldPreffix}segmentation_variable`]: null,
    });
    // reset segments
    form.setFieldsValue({ segments: [{ name: null }] });
    setSegmentationPreviews(null);
    // reset number of segments
    form.setFieldsValue({
      [`${dataUploadFieldPreffix}number_of_segments`]: null,
    });
  };

  // current segment form initial values
  //   segments: [{
  //   "id": 28,
  //   "name": "< 2",
  //   "number_of_farmers": 59
  // }]

  return (
    <Row gutter={[16, 16]}>
      {/* SEGMENT CONFIGURATION */}
      <Col span={12}>
        <p>
          <b>Variable type</b>
        </p>
        <Form.Item
          name={`${dataUploadFieldPreffix}segmentation_variable`}
          label="Segmentation variable"
          required
          style={{ marginBottom: 16 }}
        >
          <Select
            {...selectProps}
            placeholder="Select segmentation variable"
            options={segmentationVariableDropdownValue}
          />
        </Form.Item>
        <Form.Item
          name={`${dataUploadFieldPreffix}variable_type`}
          required
          noStyle
        >
          <Radio.Group onChange={handleChangeVariableType}>
            <Radio value="categorical">Categorical</Radio>
            <Radio value="numerical">Numerical</Radio>
          </Radio.Group>
        </Form.Item>
      </Col>
      <Col span={12}>
        <p>
          <b>Segmentation</b>
        </p>
        <Form.Item
          name={`${dataUploadFieldPreffix}number_of_segments`}
          label="Number of Segments"
          style={{ marginBottom: 8 }}
          required={variableType === "numerical"}
        >
          <InputNumber
            min={1}
            max={5}
            style={{ width: "100%" }}
            placeholder="e.g. 3"
            disabled={variableType !== "numerical"}
          />
        </Form.Item>
        <small>You can select up to 5 segments</small>
      </Col>
      {/* EOL SEGMENT CONFIGURATION */}

      {/* SEGMENTATION PREVIEW */}
      {loadingPreview && (
        <Col span={24} style={{ textAlign: "center", padding: "20px 0" }}>
          <Space>
            <Spin />
            <div>Loading segmentation preview...</div>
          </Space>
        </Col>
      )}
      {segmentationPreviews?.segments?.length > 0 && !loadingPreview && (
        <Col span={24} style={{ marginTop: 16 }}>
          <h3>Please input the thresholds for separating segments below:</h3>
          <SegmentForm
            deletedSegmentIds={deletedSegmentIds}
            setDeletedSegmentIds={setDeletedSegmentIds}
            isDataUpload={true}
          />
        </Col>
      )}
      {/* EOL SEGMENTATION PREVIEW */}
      {/* TODO:: Handle add another segment for data upload */}
    </Row>
  );
};

export default SegmentConfigurationForm;
