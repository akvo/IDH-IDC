import React, { useState, useMemo, useEffect } from "react";
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

const SegmentGenerator = ({ uploadResult, onUpdate, onRemove }) => {
  const [variableType, setVariableType] = useState("categorical");
  const [segmentationVariable, setSegmentationVariable] = useState(null);
  const [numberOfSegments, setNumberOfSegments] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const allowFetch =
      variableType === "numerical"
        ? [variableType, segmentationVariable, numberOfSegments]
        : [variableType, segmentationVariable];

    if (allowFetch.every((val) => val) && uploadResult?.import_id) {
      setLoading(true);
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
            label="Segmentation variable"
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
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);

  const form = Form.useFormInstance();
  const segmentFields = Form.useWatch("segments", form);

  // State to track active generators. Each generator has a unique ID and the segments it produced.
  const [generators, setGenerators] = useState([]);

  // Track manual segments separate from generator segments if needed,
  // but simplistic approach: rely on Form.List.
  // We need to know which segments in the Form.List belong to which generator to update them.
  // Strategy: Add a hidden `generator_id` field to segments?
  // Or keep track of indices? Indices shift.
  // Better: Generators trigger a rebuild of their specific segments.
  // BUT: user can manually edit those segments. We should probably purely append/replace.

  // Let's try tracking ranges or IDs.
  // Simplest: Each generator maintains its own list of segments in state.
  // The main form "segments" is a composition of [Manual Segments] + [Gen 1 Segments] + [Gen 2 Segments].
  // This is hard with Antd Form.List.

  // Alternative: When a generator updates, it finds its previous segments and replaces them.
  // How to find them? Maybe we attach `generatorId` to the segment object in the form.

  const handleGeneratorUpdate = (generatorId, newSegments) => {
    const currentSegments = form.getFieldValue("segments") || [];
    const taggedNewSegments = newSegments.map((s) => ({ ...s, generatorId }));

    // Filter out old segments from this generator
    const cleanSegments = currentSegments.filter(
      (s) => s.generatorId !== generatorId
    );

    // Combine.
    // We allow exceeding MAX_SEGMENT so that the UI can warn the user (via parent component).
    form.setFieldsValue({
      segments: [...cleanSegments, ...taggedNewSegments],
    });
  };

  const removeGenerator = (id) => {
    setGenerators((prev) => prev.filter((g) => g.id !== id));
    // Also remove its segments
    const currentSegments = form.getFieldValue("segments") || [];
    const cleanSegments = currentSegments.filter((s) => s.generatorId !== id);
    form.setFieldsValue({ segments: cleanSegments });
  };

  const addGenerator = () => {
    const newId = Date.now().toString(); // simple ID
    setGenerators((prev) => [...prev, { id: newId }]);
  };

  const onDelete = ({ field = {}, remove = () => {} }) => {
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
    const numberOfFarmers =
      relatedSegment || relatedSegment?.number_of_farmers === 0
        ? relatedSegment?.number_of_farmers
        : null;
    const formItemStyle = { marginBottom: "5px" };
    const isLoading = segmentFieldsLoading?.[`index_${relatedSegment?.index}`];
    const rangeMin = relatedSegment?.min || 0;
    const rangeMax = relatedSegment?.max || 0;

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
              onDelete({ field: { key, name, ...restField }, remove })
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
        <Row gutter={[12, 12]} align="middle">
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
              ]}
              style={formItemStyle}
            >
              <Input
                width="100%"
                placeholder="Segment name"
                disabled={!enableEditCase}
                maxLength={15}
                showCount={true}
              />
            </Form.Item>
          </Col>
          <Col span={RIGHT_COL_SPAN}>
            {
              // show segment threshold only for numerical variableType
              <Form.Item
                {...restField}
                name={[name, "value"]}
                label={segVarLabel}
                hidden={segVarType === "categorical"}
                style={formItemStyle}
              >
                <InputNumber
                  placeholder="Value"
                  controls={false}
                  style={{ width: "100%" }}
                  disabled={!enableEditCase || isLoading}
                  suffix={isLoading ? <Spin size="small" /> : ""}
                  onChange={(val) =>
                    handleOnChangeFieldValue(relatedSegment, val)
                  }
                />
              </Form.Item>
            }

            {segVarType === "categorical" ? (
              <Form.Item
                {...restField}
                label="Number of farmers"
                name={[name, "number_of_farmers"]}
                hidden={segVarType === "numerical"}
                style={formItemStyle}
              >
                <InputNumber
                  placeholder="Number of farmers"
                  controls={false}
                  style={{ width: "100%", color: "#000" }}
                  disabled={true}
                />
              </Form.Item>
            ) : (
              ""
            )}
          </Col>
          {segVarType === "numerical" &&
          (numberOfFarmers || numberOfFarmers === 0) ? (
            <Col span={24}>
              <Row gutter={[12, 12]}>
                <Col span={LEFT_COL_SPAN}>
                  <Tag>
                    <p style={{ margin: 0 }}>
                      Number of farmers: {numberOfFarmers}
                    </p>
                  </Tag>
                </Col>
                <Col span={RIGHT_COL_SPAN}>
                  <Tag>
                    <p style={{ margin: 0 }}>
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
        // Group fields by generator
        const manualFields = fields.filter(
          (f) => !segmentFields?.[f.name]?.generatorId
        );

        return (
          <>
            {/* MANUAL SEGMENTS */}
            {manualFields.map((field) =>
              renderSegmentCard(field, field.name, remove)
            )}

            {/* GENERATORS AND THEIR SEGMENTS */}
            {generators.map((gen) => {
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
            })}

            {/* Add Buttons */}
            {fields.length < MAX_SEGMENT ? (
              <Form.Item style={{ marginTop: 16 }}>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Button
                      type="ghost"
                      onClick={() => add({ name: "", number_of_farmers: 0 })}
                      block
                      icon={<PlusCircleFilled />}
                      disabled={!enableEditCase}
                      className="button-ghost button-no-border"
                      style={{ textAlign: "left", padding: "0 8px" }}
                    >
                      Add segment manually
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      type="ghost"
                      block
                      icon={<PlusCircleFilled />}
                      disabled={!enableEditCase}
                      className="button-ghost button-no-border"
                      style={{ textAlign: "left", padding: "0 8px" }}
                      onClick={addGenerator}
                    >
                      Add segment based on variable
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
