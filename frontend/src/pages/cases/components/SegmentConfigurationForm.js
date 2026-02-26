import React, { useEffect, useMemo, useState, useRef } from "react";
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
  Tooltip,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
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
  const [errorPreview, setErrorPreview] = useState(null);
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

  const lastFetchRef = useRef(null);

  useEffect(() => {
    const allowFetchPreview =
      variableType === "numerical"
        ? [variableType, segmentationVariable, numberOfSegments]
        : [variableType, segmentationVariable];

    if (
      allowFetchPreview.every((val) => val) &&
      uploadResult?.import_id &&
      !loadingPreview
    ) {
      const payload = {
        import_id: uploadResult.import_id,
        variable_type: variableType,
        segmentation_variable: segmentationVariable,
        number_of_segments: numberOfSegments ? numberOfSegments : 0,
      };

      const payloadString = JSON.stringify(payload);
      if (lastFetchRef.current === payloadString) {
        return;
      }
      lastFetchRef.current = payloadString;

      // fetch segment preview endpoint here
      setLoadingPreview(true);
      setErrorPreview(null);
      api
        .post("/case-import/segmentation-preview", payload)
        .then((res) => {
          let segments = res.data.segments || [];
          if (variableType === "numerical") {
            segments = segments.map((s) => ({ ...s, name: null }));
          }
          setSegmentationPreviews({ ...res.data, segments });
          // set segment values to form initialValue here
          form.setFieldsValue({ segments });
        })
        .catch((e) => {
          console.error("Error fetching segmentation preview:", e);
          const detail = e?.response?.data?.detail;
          const errorMessage =
            typeof detail === "string"
              ? detail
              : Array.isArray(detail)
              ? detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
              : typeof detail === "object" && detail !== null
              ? JSON.stringify(detail)
              : e?.message ||
                "An error occurred while fetching the segmentation preview.";
          setErrorPreview(errorMessage);
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
    loadingPreview,
  ]);

  const prevManualCountRef = useRef(0);

  // Sync global/manual segment count
  useEffect(() => {
    // Only apply sync if Global Variable Type is numerical
    if (variableType === "numerical" && segmentFields?.length > 1) {
      // Manual/Global segments are those without a generatorId AND NOT marked as manual
      const manualSegments = segmentFields.filter(
        (s) => !s.generatorId && !s.is_manual
      );
      const currentCount = manualSegments.length;

      // Only update if current count differs from form value AND the actual count has changed (e.g. deletion)
      if (
        currentCount !== numberOfSegments &&
        prevManualCountRef.current !== currentCount
      ) {
        // If 0, set to null to clear field instead of showing "0"
        const newValue = currentCount === 0 ? null : currentCount;

        form.setFieldsValue({
          [`${dataUploadFieldPreffix}number_of_segments`]: newValue,
        });
      }
      prevManualCountRef.current = currentCount;
    }
  }, [
    segmentFields,
    numberOfSegments,
    dataUploadFieldPreffix,
    form,
    variableType,
  ]);

  const handleOnChangeFieldValue = (selectedSegment, values = {}) => {
    const targetVarType = selectedSegment.variable_type || variableType;
    const targetSegVariable =
      selectedSegment.segmentation_variable || segmentationVariable;

    setSegmentFieldsLoading((prev) => ({
      ...prev,
      [`index_${selectedSegment.index}`]: true,
    }));

    // 1. Prepare payload: only include segments that belong to the target variable
    const relevantSegments = segmentFields.filter((s) => {
      const sVar = (
        s.segmentation_variable || segmentationVariable
      )?.toLowerCase();
      return sVar === targetSegVariable.toLowerCase();
    });

    const updatedRelevantSegments = relevantSegments.map((s) => {
      let newValue = s.value;
      let newMin = s.min;
      let newMax = s.max;

      const isCurrent = s.index === selectedSegment.index;
      const isPrev = s.index === selectedSegment.index - 1;
      const isNext = s.index === selectedSegment.index + 1;

      // 1. Update Current Segment
      if (isCurrent) {
        if (typeof values.max !== "undefined") {
          newValue = values.max;
          newMax = values.max;
        } else if (typeof values.value !== "undefined") {
          newValue = values.value;
          newMax = values.value;
        }
        if (typeof values.min !== "undefined") {
          newMin = values.min;
        }
      }

      // 2. Backward Cascade (Min N -> Max N-1)
      if (isPrev && typeof values.min !== "undefined") {
        const offset = 0.01;
        newValue = parseFloat((values.min - offset).toFixed(2));
        newMax = newValue;
      }

      // 3. Forward Cascade (Max N -> Min N+1)
      if (isNext && typeof values.max !== "undefined") {
        const offset = 0.01;
        newMin = parseFloat((values.max + offset).toFixed(2));
      }

      return {
        ...s,
        value: newValue,
        min: newMin,
        max: newMax,
        segmentation_variable: targetSegVariable,
        variable_type: targetVarType,
      };
    });

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
    const primarySegments =
      segmentFields?.filter((s) => !s.generatorId && !s.is_manual) || [];

    if (
      variableType === "numerical" &&
      primarySegments.length < numberOfSegments
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
    if (!segmentFields || segmentFields.length <= MAX_SEGMENT) {
      return null;
    }

    const primarySegments = segmentFields.filter(
      (s) => !s.generatorId && !s.is_manual
    );

    // 1. Specific categorical overflow for primary variable
    if (
      variableType === "categorical" &&
      primarySegments.length > MAX_SEGMENT
    ) {
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

    // 2. Generic total overflow (e.g. mixed variables or manual additions)
    return (
      <Col span={24}>
        <Alert
          message={
            <>
              You have created too many segments. To proceed, please keep only
              up to 5 segments.
            </>
          }
          type="warning"
        />
      </Col>
    );
  }, [segmentFields, variableType, segmentationVariable]);

  return (
    <Row gutter={[16, 16]}>
      {/* SEGMENT CONFIGURATION */}
      {/* LEFT COLUMN: Type & Variable */}
      <Col span={12}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Space size="middle">
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>
              Variable type{" "}
              <Tooltip title="What type of variable do you want to use for segmentation?">
                <QuestionCircleOutlined
                  style={{ color: "rgba(0, 0, 0, 0.45)" }}
                />
              </Tooltip>
            </span>
            <Form.Item name={`${dataUploadFieldPreffix}variable_type`} noStyle>
              <Radio.Group
                onChange={handleChangeVariableType}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="categorical">Categorical</Radio.Button>
                <Radio.Button value="numerical">Numerical</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Space>

          <Form.Item
            name={`${dataUploadFieldPreffix}segmentation_variable`}
            label="Segmentation Variable:"
            required
            style={{ marginBottom: 0 }}
          >
            <Select
              {...selectProps}
              placeholder={
                variableType ? "variable_name" : "Select a variable type first"
              }
              options={segmentationVariableDropdownValue}
              disabled={!variableType}
            />
          </Form.Item>
        </Space>
      </Col>

      {/* RIGHT COLUMN: Segmentation Summary & Count */}
      <Col span={12}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>
            Segmentation{" "}
            <Tooltip title="Configure how you want to divide your data into segments.">
              <QuestionCircleOutlined
                style={{ color: "rgba(0, 0, 0, 0.45)" }}
              />
            </Tooltip>
          </span>

          <div>
            <Form.Item
              name={`${dataUploadFieldPreffix}number_of_segments`}
              label="Number of segments:"
              style={{ marginBottom: 8 }}
              required={variableType === "numerical"}
            >
              <InputNumber
                min={0}
                max={5}
                style={{ width: "100%" }}
                placeholder="e.g. 3"
                disabled={variableType !== "numerical"}
              />
            </Form.Item>
            <small>You can select up to 5 segments</small>
          </div>
        </Space>
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
      {errorPreview && !loadingPreview && (
        <Col span={24} style={{ marginTop: 8 }}>
          <Alert message={errorPreview} type="error" />
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
                segmentationPreviews={segmentationPreviews}
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
