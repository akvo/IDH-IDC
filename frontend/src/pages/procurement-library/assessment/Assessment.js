import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Radio, Space, Tag, Tooltip } from "antd";
import { Link, useNavigate } from "react-router-dom";

import { ImpactAreaIcons, ProcurementBadge, SubmitButton } from "../components";
import EmptyResultsIcon from "../../../assets/icons/icon-empty-results.svg";
import { ArrowRight, QuestionCircleOutline } from "../../../lib/icon";
import api from "../../../lib/api";
import { LIMIT_RESULT } from "../config";
import { PLState } from "../../../store";
import "./assessment.scss";

const Assessment = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const practices = PLState.useState((s) => s.practices);
  const questions = PLState.useState((s) => s.questions);
  const navigate = useNavigate();

  const handleOnClear = () => {
    const ql = form
      .getFieldValue("questions")
      ?.map((q) => ({ ...q, indicator_id: null }));
    form.setFieldsValue({
      questions: ql,
    });
    PLState.update((s) => {
      s.practices = [];
      s.questions = ql;
    });
  };

  const handleOnFinish = async ({ questions }) => {
    setLoading(true);
    try {
      PLState.update((s) => {
        s.questions = questions;
      });
      const payload = questions.map((q) => ({
        indicator_id: q?.indicator_id,
        question_id: q?.id,
      }));
      const response = await api.post(
        `/pl/questions?limit=${LIMIT_RESULT}`,
        payload
      );
      PLState.update((s) => {
        s.practices = response.data;
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchQuestions = useCallback(async () => {
    if (questions.length > 0) {
      form.setFieldValue("questions", questions);
      return;
    }
    await api.get("/pl/questions").then((response) => {
      form.setFieldValue(
        "questions",
        response.data.map((q) => ({ ...q, indicator_id: null }))
      );
    });
  }, [form, questions]);

  useEffect(() => {
    // disable overflow on mount
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = ""; // Cleanup on unmount
    };
  }, []);

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
          <Button type="primary" onClick={handleOnClear}>
            Clear results
          </Button>
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
                            <Space align="start" justify="start">
                              <span>{field.name + 1}.</span>
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
                          rules={[
                            {
                              required: true,
                              message: "Please select an option",
                            },
                          ]}
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
                                  <div className="question-option font-tablet-gothic">
                                    <span>{option?.label}</span>
                                    <Tooltip
                                      title={
                                        <>
                                          <strong>{option?.label}</strong>
                                          <p>{option?.description}</p>
                                        </>
                                      }
                                      placement="bottom"
                                      trigger={["hover", "click"]}
                                    >
                                      <span className="question-option-icon">
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
                  <SubmitButton form={form} size="large" loading={loading}>
                    Submit
                  </SubmitButton>
                </div>
              </div>
            )}
          </Form>
        </div>
      </div>
      {practices.length === 0 && (
        <div className="assessment-practices">
          <div className="assessment-practices-empty">
            <span>
              <img src={EmptyResultsIcon} alt="Empty Results" />
            </span>
            <h3>Complete the questions to reveal your best practises</h3>
          </div>
        </div>
      )}
      {practices.length > 0 && (
        <div className="assessment-practices">
          <div className="assessment-practices-header">
            <span>
              <h2>Best matching Procurement </h2>
            </span>
            <Tag>{`${practices.length} results`}</Tag>
          </div>
          <ul className="assessment-practices-list">
            {practices.map((practice) => (
              <li key={practice.id} className="assessment-practice">
                <div className="assessment-practice-content">
                  <div>
                    <Tooltip
                      title={practice?.procurement_process_label}
                      trigger={["hover"]}
                      placement="top"
                    >
                      <ProcurementBadge
                        id={practice?.procurement_process_id}
                        text={practice?.procurement_process_label}
                      />
                    </Tooltip>
                  </div>
                  <ImpactAreaIcons
                    isEnv={practice?.is_environmental}
                    isIncome={practice?.is_income}
                  />
                </div>
                <div className="assessment-practice-content">
                  <div
                    role="button"
                    onClick={() =>
                      navigate(
                        `/procurement-library/intervention-library/${practice.id}`
                      )
                    }
                  >
                    <strong>{practice.label}</strong>
                  </div>
                  <div>
                    <Link
                      to={`/procurement-library/intervention-library/${practice.id}`}
                    >
                      Read more
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="assessment-footer">
            <Button
              type="link"
              onClick={() =>
                navigate("/procurement-library/intervention-library")
              }
            >
              <Space align="center" justify="center">
                <span>View all</span>
                <ArrowRight />
              </Space>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessment;
