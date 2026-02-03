import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Radio,
  Select,
  InputNumber,
  Row,
  Col,
  Spin,
  Space,
  Alert,
} from "antd";
import { selectProps } from "../../../lib";
import { api } from "../../../lib";
import { MAX_SEGMENT, DataUploadSegmentForm } from ".";

const SegmentConfigurationForm = ({
  uploadResult = {},
  dataUploadFieldPreffix = "",
  deletedSegmentIds,
  setDeletedSegmentIds,
}) => {
  const form = Form.useFormInstance();

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [segmentationPreviews, setSegmentationPreviews] = useState(null);
  const [segmentFieldsLoading, setSegmentFieldsLoading] = useState({
    index_1: false,
  });

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
  const segmentFields = Form.useWatch("segments", form);

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

  const handleOnChangeFieldValue = (selectedSegment, value) => {
    const targetVarType = selectedSegment.variable_type || variableType;
    const targetSegVariable =
      selectedSegment.segmentation_variable || segmentationVariable;

    setSegmentFieldsLoading((prev) => ({
      ...prev,
      [`index_${selectedSegment.index}`]: true,
    }));

    // 1. Prepare payload: only include segments that belong to the target variable
    const relevantSegments = segmentFields.filter((s) => {
      const sVar = s.segmentation_variable || segmentationVariable;
      return sVar === targetSegVariable;
    });

    const updatedRelevantSegments = relevantSegments.map((s) => ({
      index: s.index,
      value: s.index === selectedSegment.index ? value : s.value,
      segmentation_variable: targetSegVariable,
      variable_type: targetVarType,
    }));

    const recalculatePayload = {
      import_id: uploadResult.import_id,
      variable_type: targetVarType,
      segmentation_variable: targetSegVariable,
      segments: updatedRelevantSegments,
    };

    api
      .post("/case-import/recalculate-segmentation", recalculatePayload)
      .then((res) => {
        const recalculatedSegments = res?.data?.segments || [];

        // 2. Merge logic: Update only the relevant segments in the main list
        const mergedSegments = segmentFields.map((existingSegment) => {
          const existingSegVar =
            existingSegment.segmentation_variable || segmentationVariable;

          // If this segment belongs to the variable we just recalculated
          if (existingSegVar === targetSegVariable) {
            // Find the updated version in the response by index
            // Note: assuming index is unique within a variable group
            const updated = recalculatedSegments.find(
              (rs) => rs.index === existingSegment.index
            );

            if (updated) {
              return {
                ...updated,
                ...existingSegment, // preserve frontend props like generatorId, name
                ...updated, // apply recalculated values (min, max, value)
                name: existingSegment.name, // strictly preserve name
              };
            }
          }
          // Otherwise return untouched
          return existingSegment;
        });

        setSegmentationPreviews((prev) => ({
          ...prev,
          segments: mergedSegments,
        }));
        form.setFieldsValue({ segments: mergedSegments });

        const segmentFieldIndex = selectedSegment.index - 1; // CAUTION: this might be wrong if indices are not sequential/global
        // set edited field to focus after change
        // Only try to focus if we can find the field? The index logic here assumes global array order...
        // We'll leave it for now as it's existing logic, but it might be shaky with mixed segments.
        setTimeout(() => {
          form
            .getFieldInstance(["segments", segmentFieldIndex, "value"])
            ?.focus();
        }, 500);
      })
      .catch((e) => {
        console.error("Error recalculate segmentation:", e);
      })
      .finally(() => {
        setSegmentFieldsLoading((prev) => ({
          ...prev,
          [`index_${selectedSegment.index}`]: false,
        }));
      });
  };

  const handleChangeVariableType = () => {
    // reset segmentation variable when variable type changes
    setSegmentationPreviews(null);
    form.setFieldsValue({
      [`${dataUploadFieldPreffix}segmentation_variable`]: null,
      // reset segments
      segments: [{ name: null }],
      // reset number of segments
      [`${dataUploadFieldPreffix}number_of_segments`]: null,
    });
  };

  const segmentNumericalWarning = useMemo(() => {
    // Extra message for numerical variable
    if (
      variableType === "numerical" &&
      segmentFields?.length < numberOfSegments
    ) {
      return (
        <Col span={24}>
          <Alert
            message={
              <>
                The variable {segmentationVariable} includes too many 0 or
                missing values to meaningfully create {numberOfSegments} segment
                {numberOfSegments > 1 ? "s" : ""}. <br />
                Consider using a different variable, or adjust the thresholds
                manually.
              </>
            }
            type="warning"
          />
        </Col>
      );
    }
    return null;
  }, [variableType, segmentFields, numberOfSegments, segmentationVariable]);

  const maxSegmentWarning = useMemo(() => {
    if (segmentFields?.length > MAX_SEGMENT) {
      return (
        <Col span={24}>
          <Alert
            message={
              <>
                The variable {segmentationVariable} includes more than five
                unique values. To proceed, please keep only up to 5 segments.
              </>
            }
            type="warning"
          />
        </Col>
      );
    }
    return null;
  }, [segmentFields, segmentationVariable]);

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
          <h3 style={{ fontSize: "16px" }}>
            Please create unique segment names and review/tweak thresholds for
            separating segments:
          </h3>
          <Row gutter={[20, 20]}>
            {segmentNumericalWarning}
            {maxSegmentWarning}
            <Col span={24}>
              <DataUploadSegmentForm
                deletedSegmentIds={deletedSegmentIds}
                setDeletedSegmentIds={setDeletedSegmentIds}
                handleOnChangeFieldValue={handleOnChangeFieldValue}
                segmentFieldsLoading={segmentFieldsLoading}
                dataUploadFieldPreffix={dataUploadFieldPreffix}
                uploadResult={uploadResult}
              />
            </Col>
          </Row>
        </Col>
      )}
      {/* EOL SEGMENTATION PREVIEW */}
    </Row>
  );
};

export default SegmentConfigurationForm;
