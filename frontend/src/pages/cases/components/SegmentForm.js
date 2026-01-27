import React from "react";
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
} from "antd";
import { DeleteOutlined, PlusCircleFilled } from "@ant-design/icons";
import { CaseUIState, CurrentCaseState } from "../store";
import { MAX_SEGMENT } from ".";

const SegmentForm = ({
  deletedSegmentIds = [],
  setDeletedSegmentIds = () => {},
  isDataUpload = false,
  handleOnChangeFieldValue = (/* currentSegment, value */) => {},
  segmentFieldsLoading = {},
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);

  const form = Form.useFormInstance();
  const segmentFields = Form.useWatch("segments", form);

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

  return (
    <Form.List name="segments">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }, index) => {
            const relatedSegment = segmentFields?.[name] || null;
            const numberOfFarmers =
              relatedSegment || relatedSegment?.number_of_farmers === 0
                ? relatedSegment?.number_of_farmers
                : null;
            const formItemStyle = isDataUpload ? { marginBottom: "5px" } : {};
            const isLoading =
              segmentFieldsLoading?.[`index_${relatedSegment?.index}`];

            return (
              <Card
                key={key}
                size="small"
                title={`Segment ${index + 1}`}
                extra={
                  fields.length > 1 ? (
                    <Popconfirm
                      title="Delete Segment"
                      description={
                        <div style={{ width: 350 }}>
                          Are you sure you want to delete this segment?
                          <br />
                          This will permanently remove the selected segment and
                          all its contents.
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
                        // onClick={() => remove(name)}
                        disabled={!enableEditCase}
                      />
                    </Popconfirm>
                  ) : null
                }
                className="segment-card-container"
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
                  <Col span={14}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      label={isDataUpload ? "Segment name" : null}
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
                  <Col span={10}>
                    {isDataUpload ? (
                      <Form.Item
                        {...restField}
                        name={[name, "value"]}
                        label={isDataUpload ? "Segment Threshold" : null}
                        hidden={!isDataUpload}
                        style={formItemStyle}
                      >
                        <InputNumber
                          placeholder="Value"
                          controls={false}
                          style={{ width: "100%" }}
                          disabled={!enableEditCase || isLoading}
                          suffix={
                            isDataUpload && isLoading ? (
                              <Spin size="small" />
                            ) : (
                              ""
                            )
                          }
                          onChange={(val) =>
                            handleOnChangeFieldValue(relatedSegment, val)
                          }
                        />
                      </Form.Item>
                    ) : (
                      <Form.Item
                        {...restField}
                        name={[name, "number_of_farmers"]}
                        hidden={isDataUpload}
                        style={formItemStyle}
                      >
                        <InputNumber
                          placeholder="Number of farmers"
                          controls={false}
                          style={{ width: "100%" }}
                          disabled={!enableEditCase}
                        />
                      </Form.Item>
                    )}
                  </Col>
                  {isDataUpload &&
                  (numberOfFarmers || numberOfFarmers === 0) ? (
                    <Col span={24}>
                      <Tag>
                        <p style={{ margin: 0 }}>
                          Number of farmers: {numberOfFarmers}
                        </p>
                      </Tag>
                    </Col>
                  ) : (
                    ""
                  )}
                </Row>
              </Card>
            );
          })}
          {fields.length < MAX_SEGMENT ? (
            <Form.Item>
              <Button
                type="ghost"
                onClick={() => add()}
                block
                icon={<PlusCircleFilled />}
                disabled={!enableEditCase}
                className="button-ghost button-no-border"
              >
                Add another segment
              </Button>
            </Form.Item>
          ) : null}
        </>
      )}
    </Form.List>
  );
};

export default SegmentForm;
