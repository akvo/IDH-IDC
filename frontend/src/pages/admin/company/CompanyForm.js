import React, { useEffect, useState } from "react";
import "./company.scss";
import { useNavigate, useParams } from "react-router-dom";
import { ContentLayout } from "../../../components/layout";
import { Form, Input, Card, Button, Spin, message } from "antd";
import { api } from "../../../lib";
import { UIState } from "../../../store";
import orderBy from "lodash/orderBy";

const CompanyForm = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [initValues, setInitValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (companyId) {
      setLoading(true);
      api
        .get(`company/${companyId}`)
        .then((res) => {
          const { data } = res;
          setInitValues(data);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setTimeout(() => {
            setLoading(false);
          }, 500);
        });
    }
  }, [companyId]);

  const onFinish = (values) => {
    setSubmitting(true);
    const { name } = values;
    const payload = {
      name: name,
    };
    const apiCall = companyId
      ? api.put(`company/${companyId}`, payload)
      : api.post("company", payload);
    apiCall
      .then((res) => {
        const { data } = res;
        // Update companyOptions state
        UIState.update((s) => {
          s.companyOptions = orderBy(
            [...s.companyOptions, { label: data.name, value: data.id }],
            ["label"],
            ["asc"]
          );
        });
        messageApi.open({
          type: "success",
          content: "Company saved successfully.",
        });
        setTimeout(() => {
          form.resetFields();
          navigate("/admin/companies");
        }, 500);
      })
      .catch((e) => {
        console.error(e);
        messageApi.open({
          type: "error",
          content: "Failed! Something went wrong.",
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
        { title: "Companies", href: "/admin/companies" },
        {
          title: `${companyId ? "Edit" : "Add"} Company`,
          href: `/admin/company/${companyId ? companyId : "new"}`,
        },
      ]}
      title={`${companyId ? "Edit" : "Add"} Company`}
      wrapperId="company"
    >
      {contextHolder}
      {loading ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        <Form
          form={form}
          name="company-form"
          layout="vertical"
          initialValues={initValues}
          onFinish={onFinish}
          className="company-form-container"
        >
          <Card>
            <Form.Item
              label="Company Name"
              name="name"
              rules={[{ required: true, message: "Company is required" }]}
            >
              <Input />
            </Form.Item>
          </Card>
          <Form.Item>
            <Button
              className="button button-submit button-secondary"
              htmlType="submit"
              style={{ width: "200px", float: "left" }}
              loading={submitting}
            >
              Save Company
            </Button>
          </Form.Item>
        </Form>
      )}
    </ContentLayout>
  );
};

export default CompanyForm;
