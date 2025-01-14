import React from "react";
import { Form, Card, Button, Row, Col, Input, InputNumber } from "antd";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";

const SegmentForm = () => {
  const MAX_SEGMENT = 5;
  return (
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
                  <Button
                    type="icon"
                    icon={<CloseOutlined />}
                    onClick={() => remove(name)}
                  />
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
                    <Input width="100%" placeholder="Segment name" />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item {...restField} name={[name, "number_of_farmers"]}>
                    <InputNumber
                      placeholder="Number of farmers"
                      controls={false}
                      style={{ width: "100%" }}
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
