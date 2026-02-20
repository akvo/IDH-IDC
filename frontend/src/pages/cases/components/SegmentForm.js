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
} from "antd";
import { DeleteOutlined, PlusCircleFilled } from "@ant-design/icons";
import { CaseUIState, CurrentCaseState } from "../store";
import { MAX_SEGMENT } from ".";

const LEFT_COL_SPAN = 14;
const RIGHT_COL_SPAN = 10;

const SegmentForm = ({
  deletedSegmentIds = [],
  setDeletedSegmentIds = () => {},
}) => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);

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
                    style={{ marginBottom: 0 }}
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
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        width="100%"
                        placeholder="Please specify the segment name"
                        disabled={!enableEditCase}
                        maxLength={15}
                        showCount={true}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={RIGHT_COL_SPAN}>
                    <Form.Item
                      {...restField}
                      name={[name, "number_of_farmers"]}
                      label="Number of farmers"
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        placeholder="Number of farmers"
                        controls={false}
                        style={{ width: "100%" }}
                        disabled={!enableEditCase}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            );
          })}
          {fields.length < MAX_SEGMENT ? (
            <Form.Item>
              <Button
                type="ghost"
                onClick={() => add({ name: "", number_of_farmers: 0 })}
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
