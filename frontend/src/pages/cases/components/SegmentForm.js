import React from "react";
import {
  Form,
  Card,
  Button,
  Row,
  Col,
  Input,
  InputNumber,
  message,
  Popconfirm,
} from "antd";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { CaseUIState, CurrentCaseState } from "../store";
import { api } from "../../../lib";

const MAX_SEGMENT = 5;

const SegmentForm = () => {
  const { enableEditCase } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);

  const [messageApi, messageContextHolder] = message.useMessage();

  const onDelete = ({ field = {}, remove = () => {} }) => {
    // delete segment
    const segmentIndex = field?.name;
    const findCurrentSegment = currentCase?.segments?.[segmentIndex];
    if (findCurrentSegment?.id) {
      api
        .delete(`segment/${findCurrentSegment.id}`)
        .then(() => {
          remove(segmentIndex);
        })
        .catch((e) => {
          console.error(e);
          messageApi.open({
            type: "error",
            content: "Failed to delete a segment.",
          });
        });
    } else {
      remove(segmentIndex);
    }
  };

  return (
    <>
      {messageContextHolder}
      <Form.List name="segments">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <Card
                key={key}
                size="small"
                title={`Segment ${index + 1}`}
                extra={
                  fields.length > 1 ? (
                    <Popconfirm
                      title="Delete the task"
                      description="Are you sure to delete this segment? This action can't be undone."
                      onConfirm={() =>
                        onDelete({ field: { key, name, ...restField }, remove })
                      }
                      okText="Delete"
                      cancelText="Cancel"
                      placement="leftBottom"
                    >
                      <Button
                        type="icon"
                        icon={<CloseOutlined />}
                        // onClick={() => remove(name)}
                        disabled={!enableEditCase}
                      />
                    </Popconfirm>
                  ) : null
                }
                className="segment-card-container"
              >
                <Row gutter={[12, 12]} align="middle">
                  <Form.Item {...restField} name={[name, "id"]} hidden={true}>
                    <Input disabled />
                  </Form.Item>
                  <Col span={14}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[
                        {
                          required: true,
                          message: `Segment ${index + 1} name required`,
                        },
                      ]}
                    >
                      <Input
                        width="100%"
                        placeholder="Segment name"
                        disabled={!enableEditCase}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      {...restField}
                      name={[name, "number_of_farmers"]}
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
            ))}
            {fields.length < MAX_SEGMENT ? (
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  disabled={!enableEditCase}
                >
                  Add another segment
                </Button>
              </Form.Item>
            ) : null}
          </>
        )}
      </Form.List>
    </>
  );
};

export default SegmentForm;
