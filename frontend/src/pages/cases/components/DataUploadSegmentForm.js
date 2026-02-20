import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Form,
  Card,
  Button,
  Row,
  Col,
  Input,
  InputNumber,
  Popconfirm,
  Tag,
  Spin,
  Radio,
  Select,
  Alert,
  Space,
} from "antd";
import {
  DeleteOutlined,
  PlusCircleFilled,
  CloseOutlined,
} from "@ant-design/icons";
import { CaseUIState, CurrentCaseState } from "../store";
import { MAX_SEGMENT } from ".";
import { selectProps, api } from "../../../lib";

const LEFT_COL_SPAN = 14;
const RIGHT_COL_SPAN = 10;

const SegmentGenerator = ({
  uploadResult,
  onUpdate,
  onRemove,
  currentCount,
}) => {
  const [variableType, setVariableType] = useState("categorical");
  const [segmentationVariable, setSegmentationVariable] = useState(null);
  const [numberOfSegments, setNumberOfSegments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const variableOptions = useMemo(() => {
    const dataColumns = uploadResult?.columns || {};
    if (!variableType || !dataColumns?.[variableType]) {
      return [];
    }
    return dataColumns[variableType].map((col) => ({
      label: col,
      value: col,
    }));
  }, [uploadResult, variableType]);

  const prevCountRef = useRef(currentCount);

  // Sync internal state with actual number of segments (e.g. after deletion)
  useEffect(() => {
    // Only sync if the actual count has changed (e.g. user deleted a segment)
    // This prevents resetting the field when the user is just typing a new number.
    if (variableType === "numerical" && prevCountRef.current !== currentCount) {
      if (
        typeof currentCount === "number" &&
        currentCount !== numberOfSegments
      ) {
        // If count is 0, set to null (empty) so it doesn't show "0" in input
        setNumberOfSegments(currentCount === 0 ? null : currentCount);
      }
    }
    prevCountRef.current = currentCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCount, variableType]);

  useEffect(() => {
    const allowFetch =
      variableType === "numerical"
        ? [variableType, segmentationVariable, numberOfSegments]
        : [variableType, segmentationVariable];

    if (allowFetch.every((val) => val) && uploadResult?.import_id) {
      setLoading(true);
      setError(null);
      const payload = {
        import_id: uploadResult.import_id,
        variable_type: variableType,
        segmentation_variable: segmentationVariable,
        number_of_segments: numberOfSegments ? numberOfSegments : 0,
      };
      api
        .post("/case-import/segmentation-preview", payload)
        .then((res) => {
          const segments = res.data.segments || [];
          const enrichedSegments = segments.map((s) => ({
            ...s,
            variable_type: variableType,
            segmentation_variable: segmentationVariable,
          }));
          onUpdate(enrichedSegments);
        })
        .catch((e) => {
          console.error("Error fetching preview:", e);
          setError(
            e?.response?.data?.detail ||
              e?.message ||
              "An error occurred while fetching the segmentation preview."
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variableType, segmentationVariable, numberOfSegments, uploadResult]);

  return (
    <Card
      size="small"
      style={{ marginTop: 16, background: "#f9f9f9", borderColor: "#d9d9d9" }}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Additional Segment Generator</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onRemove}
            size="small"
            danger
          />
        </div>
      }
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <p>
            <b>Variable type</b>
          </p>
          <Form.Item
            label="Select a variable to segment by:"
            style={{ marginBottom: 16 }}
            required
          >
            <Select
              {...selectProps}
              placeholder="Select variable"
              options={variableOptions}
              value={segmentationVariable}
              onChange={setSegmentationVariable}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Radio.Group
              value={variableType}
              onChange={(e) => {
                setVariableType(e.target.value);
                setSegmentationVariable(null);
                setNumberOfSegments(null);
              }}
            >
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
            label="Number of Segments"
            style={{ marginBottom: 8 }}
            required={variableType === "numerical"}
          >
            <InputNumber
              min={1}
              max={5}
              style={{ width: "100%" }}
              placeholder="e.g. 3"
              value={numberOfSegments}
              onChange={setNumberOfSegments}
              disabled={variableType !== "numerical"}
            />
          </Form.Item>
          <small>You can select up to 5 segments</small>
        </Col>
        {loading && (
          <Col span={24} style={{ textAlign: "center", marginTop: 10 }}>
            <Spin size="small" /> Generating segments...
          </Col>
        )}
        {error && !loading && (
          <Col span={24} style={{ marginTop: 8 }}>
            <Alert message={error} type="error" />
          </Col>
        )}
      </Row>
    </Card>
  );
};

const DataUploadSegmentForm = ({
  deletedSegmentIds = [],
  setDeletedSegmentIds = () => {},
  handleOnChangeFieldValue = (/* currentSegment, value */) => {},
  segmentFieldsLoading = {},
  dataUploadFieldPreffix = "",
  uploadResult = {},
  segmentationPreviews = null,
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);

  const form = Form.useFormInstance();
  const segmentFields = Form.useWatch("segments", form);

  // State to track the chronological sequence of additions (manual segment IDs or generator IDs)
  const [layoutSequence, setLayoutSequence] = useState([]);

  // State to track active generators. Each generator has a unique ID and the segments it produced.
  const [generators, setGenerators] = useState([]);

  const handleGeneratorUpdate = (generatorId, newSegments) => {
    const currentSegments = form.getFieldValue("segments") || [];
    const taggedNewSegments = newSegments.map((s) => ({ ...s, generatorId }));

    // Rebuild segments: keep segments for OTHER generators or manual segments.
    // Replace segments for THIS specific generator.
    const otherSegs = currentSegments.filter(
      (s) => s.generatorId !== generatorId
    );
    form.setFieldsValue({
      segments: [...otherSegs, ...taggedNewSegments],
    });
  };

  const removeGenerator = (id) => {
    setGenerators((prev) => prev.filter((g) => g.id !== id));
    setLayoutSequence((prev) => prev.filter((item) => item !== id));
    // Also remove its segments
    const currentSegments = form.getFieldValue("segments") || [];
    const cleanSegments = currentSegments.filter((s) => s.generatorId !== id);
    form.setFieldsValue({ segments: cleanSegments });
  };

  const addGenerator = () => {
    const newId = `gen-${Date.now()}`;
    setGenerators((prev) => [...prev, { id: newId }]);
    setLayoutSequence((prev) => [...prev, newId]);
  };

  const addManual = (add) => {
    const manualId = `manual-${Date.now()}`;
    add({
      name: "",
      number_of_farmers: 0,
      layoutId: manualId,
      is_manual: true,
    });
    setLayoutSequence((prev) => [...prev, manualId]);
  };

  const onDelete = ({ field = {}, remove = () => {}, layoutId }) => {
    // remove from layout sequence
    if (layoutId) {
      setLayoutSequence((prev) => prev.filter((id) => id !== layoutId));
    }

    // add delete segment into deletedSegmentIds state
    const deletedIdsLength = deletedSegmentIds.length;
    const segmentIndex = field.name;
    const findCurrentSegment =
      currentCase?.segments?.[segmentIndex + deletedIdsLength]; // adding length of deleted ids to get the correct segments
    if (findCurrentSegment?.id) {
      setDeletedSegmentIds((prev) => [
        ...new Set([...prev, findCurrentSegment.id]),
      ]);
    }
    remove(segmentIndex);
  };

  const variableType = Form.useWatch(
    `${dataUploadFieldPreffix}variable_type`,
    form
  );
  const segmentationVariable = Form.useWatch(
    `${dataUploadFieldPreffix}segmentation_variable`,
    form
  );

  // Helper to render a single segment card.
  // We pass 'index' as the true global index for title/logic.
  const renderSegmentCard = (field, index, remove) => {
    const { key, name, ...restField } = field;
    const relatedSegment = segmentFields?.[name] || null;
    const isManual = !!relatedSegment?.layoutId?.startsWith("manual-");

    const numberOfFarmers =
      relatedSegment || relatedSegment?.number_of_farmers === 0
        ? relatedSegment?.number_of_farmers
        : null;
    const formItemStyle = { marginBottom: "5px" };
    const isLoading = segmentFieldsLoading?.[`index_${relatedSegment?.index}`];

    // Static range logic: find the original segment data from segmentationPreviews
    // to ensure the label does not update while the user is typing in the input fields.
    const originalSegment = segmentationPreviews?.segments?.find((s) => {
      const sVar = (
        s.segmentation_variable || segmentationVariable
      )?.toLowerCase();
      const rVar = (
        relatedSegment?.segmentation_variable || segmentationVariable
      )?.toLowerCase();
      return sVar === rVar && s.index === relatedSegment?.index;
    });

    const rangeMin = originalSegment
      ? originalSegment.min
      : relatedSegment?.min || 0;
    const rangeMax = originalSegment
      ? originalSegment.max || originalSegment.value
      : relatedSegment?.max || relatedSegment?.value || 0;

    // Determine label based on individual segment or global fallback
    const segVarLabel =
      relatedSegment?.segmentation_variable || segmentationVariable;
    const segVarType = relatedSegment?.variable_type || variableType;

    return (
      <Card
        key={key}
        size="small"
        title={`Segment ${index + 1}`}
        extra={
          <Popconfirm
            title="Delete Segment"
            description={
              <div style={{ width: 350 }}>
                Are you sure you want to delete this segment?
                <br />
                This will permanently remove the selected segment and all its
                contents.
                <br />
                This action is <b>irreversible</b>.
              </div>
            }
            onConfirm={() =>
              onDelete({
                field: { key, name, ...restField },
                remove,
                layoutId: relatedSegment?.layoutId,
              })
            }
            okText="Delete"
            cancelText="Cancel"
            placement="leftBottom"
          >
            <Button
              type="icon"
              icon={<DeleteOutlined style={{ color: "red" }} />}
              disabled={!enableEditCase}
            />
          </Popconfirm>
        }
        className="segment-card-container"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[12, 12]} align="top">
          <Form.Item
            {...restField}
            name={[name, "id"]}
            hidden={true}
            style={formItemStyle}
          >
            <Input disabled />
          </Form.Item>
          {/* Hidden generator ID to track ownership */}
          <Form.Item
            {...restField}
            name={[name, "generatorId"]}
            hidden={true}
            style={formItemStyle}
          >
            <Input disabled />
          </Form.Item>
          {/* Hidden layout ID for chronological tracking */}
          <Form.Item
            {...restField}
            name={[name, "layoutId"]}
            hidden={true}
            style={formItemStyle}
          >
            <Input disabled />
          </Form.Item>
          {/* Hidden manual flag */}
          <Form.Item
            {...restField}
            name={[name, "is_manual"]}
            hidden={true}
            style={formItemStyle}
            valuePropName="checked"
          >
            <Input type="checkbox" disabled />
          </Form.Item>
          <Col span={LEFT_COL_SPAN}>
            <Form.Item
              {...restField}
              name={[name, "name"]}
              label="Segment name"
              rules={[
                {
                  required: true,
                  message: `Segment ${index + 1} name required`,
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) {
                      return Promise.resolve();
                    }
                    const segments = getFieldValue("segments") || [];
                    const duplicate = segments.filter(
                      (s, i) =>
                        i !== index &&
                        s?.name?.trim().toLowerCase() ===
                          value?.trim().toLowerCase()
                    );
                    if (duplicate.length > 0) {
                      return Promise.reject(
                        new Error("Segment names must be unique")
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
              style={formItemStyle}
            >
              <Input
                width="100%"
                placeholder={
                  segVarType === "numerical"
                    ? "Please specify the segment name"
                    : "Segment name"
                }
                disabled={!enableEditCase}
                maxLength={15}
                showCount={true}
              />
            </Form.Item>
          </Col>
          <Col span={RIGHT_COL_SPAN}>
            {segVarType === "numerical" && !isManual ? (
              <Form.Item label={segVarLabel} style={formItemStyle}>
                <Space align="center" size="small">
                  <Form.Item
                    {...restField}
                    name={[name, "min"]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      controls={false}
                      style={{ width: "100%" }}
                      disabled={!enableEditCase || isLoading}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "value"]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      id={`segment_${name}_value`}
                      controls={false}
                      style={{ width: "100%" }}
                      disabled={!enableEditCase || isLoading}
                    />
                  </Form.Item>
                  {isLoading && (
                    <Spin size="small" style={{ marginTop: "6px" }} />
                  )}
                  <Button
                    className="threshold-adjust-btn"
                    onClick={() => {
                      const minVal = form.getFieldValue([
                        "segments",
                        name,
                        "min",
                      ]);
                      const maxVal = form.getFieldValue([
                        "segments",
                        name,
                        "value",
                      ]);

                      // Send both min and max to ensure both bounds are updated and recalculated correctly
                      handleOnChangeFieldValue(relatedSegment, {
                        min: minVal,
                        max: maxVal,
                      });
                    }}
                    disabled={!enableEditCase || isLoading}
                  >
                    Adjust
                  </Button>
                </Space>
              </Form.Item>
            ) : (
              <Form.Item
                {...restField}
                name={[name, "value"]}
                label={segVarLabel}
                hidden={segVarType === "categorical" || isManual}
                style={formItemStyle}
              >
                <InputNumber
                  placeholder="Value"
                  controls={false}
                  style={{ width: "100%" }}
                  disabled={!enableEditCase || isLoading}
                  suffix={isLoading ? <Spin size="small" /> : ""}
                  onChange={(val) =>
                    handleOnChangeFieldValue(relatedSegment, { value: val })
                  }
                />
              </Form.Item>
            )}

            <Form.Item
              {...restField}
              label="Number of farmers"
              name={[name, "number_of_farmers"]}
              hidden={segVarType === "numerical" && !isManual}
              style={formItemStyle}
            >
              <InputNumber
                placeholder="Number of farmers"
                controls={false}
                style={{ width: "100%", color: "#000" }}
                disabled={!isManual || !enableEditCase}
              />
            </Form.Item>
          </Col>
          {!isManual &&
          segVarType === "numerical" &&
          (numberOfFarmers || numberOfFarmers === 0) ? (
            <Col span={24}>
              <Row gutter={[12, 12]}>
                <Col span={LEFT_COL_SPAN}>
                  <Tag className="farmer-count-tag">
                    <p>Number of farmers: {numberOfFarmers}</p>
                  </Tag>
                </Col>
                <Col span={RIGHT_COL_SPAN}>
                  <Tag className="segment-info-tag">
                    <p>
                      Segment range: {rangeMin} - {rangeMax}
                    </p>
                  </Tag>
                </Col>
              </Row>
            </Col>
          ) : (
            ""
          )}
        </Row>
      </Card>
    );
  };

  return (
    <Form.List name="segments">
      {(fields, { add, remove }) => {
        return (
          <>
            {/* Render any segments that were NOT in layoutSequence (e.g. initial loads if any) at the top */}
            {fields.map((field) => {
              const seg = segmentFields?.[field.name];
              if (seg?.layoutId && layoutSequence.includes(seg.layoutId)) {
                return null;
              }
              if (
                seg?.generatorId &&
                layoutSequence.includes(seg.generatorId)
              ) {
                return null;
              }
              return renderSegmentCard(field, field.name, remove);
            })}

            {layoutSequence.map((seqId) => {
              const gen = generators.find((g) => g.id === seqId);
              if (gen) {
                // Render Generator block
                const genFields = fields.filter(
                  (f) => segmentFields?.[f.name]?.generatorId === gen.id
                );
                return (
                  <div key={gen.id}>
                    <SegmentGenerator
                      uploadResult={uploadResult}
                      onUpdate={(segments) =>
                        handleGeneratorUpdate(gen.id, segments)
                      }
                      onRemove={() => removeGenerator(gen.id)}
                      currentCount={genFields.length}
                    />
                    <div
                      style={{
                        marginTop: 16,
                        paddingLeft: 12,
                        borderLeft: "2px solid #f0f0f0",
                      }}
                    >
                      {genFields.map((field) =>
                        renderSegmentCard(field, field.name, remove)
                      )}
                    </div>
                  </div>
                );
              }

              // Otherwise it's a manual segment ID
              const manualField = fields.find(
                (f) => segmentFields?.[f.name]?.layoutId === seqId
              );

              if (manualField) {
                return renderSegmentCard(manualField, manualField.name, remove);
              }

              return null;
            })}

            {/* Add Buttons */}
            {fields.length < MAX_SEGMENT ? (
              <Form.Item style={{ marginTop: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                  <Col>
                    <Button
                      onClick={() => addManual(add)}
                      block
                      icon={<PlusCircleFilled />}
                      disabled={!enableEditCase}
                      style={{ textAlign: "left", padding: "0 8px" }}
                    >
                      Add segment manually
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      type="ghost"
                      block
                      icon={<PlusCircleFilled />}
                      disabled={!enableEditCase}
                      className="button-ghost button-no-border"
                      style={{ textAlign: "left", padding: "0 8px" }}
                      onClick={addGenerator}
                    >
                      Add segment based on a different variable
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            ) : null}
          </>
        );
      }}
    </Form.List>
  );
};

export default DataUploadSegmentForm;
