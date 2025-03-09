import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Radio, Space, Tooltip } from "antd";
import { Link } from "react-router-dom";

import { QuestionCircleOutline } from "../../../lib/icon";
import api from "../../../lib/api";
import "./assessment.scss";

const Assessment = () => {
  const [form] = Form.useForm();
  const [practices, setPractices] = useState([]);

  const handleOnFinish = async ({ questions }) => {
    try {
      const payload = questions.map((q) => ({
        indicator_id: q?.indicator_id,
        question_id: q?.id,
      }));
      const response = await api.post("/pl/questions", payload);
      setPractices(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = useCallback(async () => {
    await api.get("/pl/questions").then((response) => {
      form.setFieldValue(
        "questions",
        response.data.map((q) => ({ ...q, indicator_id: null }))
      );
    });
  }, [form]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return (
    <div className="assessment-container">
      <div className="assessment-form">
        <ul className="assessment-tabs">
          <li className="assessment-tab active">
            <Link to="/procurement-library/assessment">Assessment</Link>
          </li>
          <li className="assessment-tab">
            <Link to="/procurement-library/intervention-library">
              Intervention Library
            </Link>
          </li>
          <li className="assessment-tab">
            <Link to="/procurement-library/methodology">Methodology</Link>
          </li>
        </ul>
        <div className="assessment-form-header">
          <h1>Find good Procurement Practices</h1>
          <p>
            Answer five quick questions about your business and discover the
            procurement practices that fit your situation and help you achieve
            your desired impact.
          </p>
          <Button type="primary">Clear results</Button>
        </div>
        <div className="assessment-form-body">
          <Form
            layout="vertical"
            form={form}
            initialValues={{ questions: [] }}
            onFinish={handleOnFinish}
          >
            {(_, formInstance) => (
              <div>
                <Form.List name="questions">
                  {(fields) => (
                    <>
                      {fields.map((field) => (
                        <Form.Item
                          name={[field.name, "indicator_id"]}
                          label={
                            <Space>
                              <span>{field.name + 1}</span>
                              <span>
                                {formInstance.getFieldValue([
                                  "questions",
                                  field.name,
                                  "label",
                                ])}
                              </span>
                            </Space>
                          }
                          key={`radio-group-${field.key}`}
                        >
                          <Radio.Group
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                            options={formInstance
                              .getFieldValue([
                                "questions",
                                field.name,
                                "options",
                              ])
                              ?.map((option) => ({
                                value: option?.indicator_id,
                                label: (
                                  <div className="question-option">
                                    <span>{option?.label}</span>
                                    <Tooltip
                                      title={
                                        <>
                                          <strong>Farmer income</strong>
                                          <p>
                                            Characterized by established market
                                            regulations, though on smaller
                                            scale. Market playe are likely to be
                                            more mature, less fragmented market
                                            structure. The supply chain is in a
                                            expanding phase & market size, while
                                            limited to a local or national
                                            level, is well-established
                                          </p>
                                        </>
                                      }
                                      placement="bottom"
                                      trigger={["hover", "click"]}
                                    >
                                      <span>
                                        <QuestionCircleOutline />
                                      </span>
                                    </Tooltip>
                                  </div>
                                ),
                              }))}
                          />
                        </Form.Item>
                      ))}
                    </>
                  )}
                </Form.List>
                <div>
                  <Button type="primary" htmlType="submit">
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </div>
      </div>
      <div className="assessment-practices">
        <h2>Best matching Procurement </h2>
        <ul>
          {practices.map((practice) => (
            <li key={practice.id}>
              <h3>{practice.label}</h3>
              <p>{practice?.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Assessment;
