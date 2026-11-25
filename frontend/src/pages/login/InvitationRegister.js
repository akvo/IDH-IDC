import React, { useEffect, useState } from "react";
import "./login.scss";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Input, Spin, message } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import AuthSplitLayout, { SUPPORT_EMAIL } from "./components/AuthSplitLayout";
import ImageRight from "../../assets/images/login-right-img.jpg";
import {
  CommoditiesField,
  CompanyNameField,
  PasswordField,
  RegionField,
  SectorField,
} from "./components/ProfileFormFields";
import { getErrorDetail, toProfilePayload, useCompanyNames } from "./utils";

// The design asks for one name, the backend stores first and last name
export const splitFullname = (fullname = "") => {
  const [first = "", ...rest] = fullname.trim().split(/\s+/);
  return { first_name: first, last_name: rest.join(" ") };
};

const fullnameRule = {
  validator: (_, value = "") => {
    const { first_name, last_name } = splitFullname(value);
    if (!first_name) {
      return Promise.reject(new Error("Please enter your name"));
    }
    return last_name
      ? Promise.resolve()
      : Promise.reject(new Error("Please enter your first and last name"));
  },
};

const InvalidInvitation = () => (
  <div className="login-toast-wrapper">
    <div
      className="login-alert-toast toast-warning"
      data-testid="invitation-invalid"
      role="alert"
    >
      <div className="toast-icon">
        <WarningOutlined style={{ color: "#ff5d00", fontSize: 20 }} />
      </div>
      <div className="toast-content">
        <p className="toast-message">
          This invitation link has expired or has already been used. Ask IDH for
          a new invitation.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="toast-action-btn toast-action-warning"
        >
          Contact {SUPPORT_EMAIL}
        </a>
      </div>
    </div>
  </div>
);

// IDC invitation (TLSA-015): the invitee completes their profile and sets
// a password, then logs in. The email comes from the invitation, so the
// form follows the design and does not show it.
const InvitationRegister = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const companyNames = useCompanyNames();

  useEffect(() => {
    let active = true;
    setStatus("loading");
    api
      .get(`user/invitation/${tokenId}`)
      .then(({ data }) => {
        if (!active) {
          return;
        }
        form.setFieldsValue({
          fullname: data.fullname,
          ...(data.company_name && { company_name: data.company_name }),
        });
        setStatus("ready");
      })
      .catch(() => active && setStatus("invalid"));
    return () => {
      active = false;
    };
  }, [tokenId, form]);

  const onFinish = (values) => {
    setSaving(true);
    api
      .post(`user/complete-invitation/${tokenId}`, {
        ...toProfilePayload(values),
        ...splitFullname(values.fullname),
      })
      .then(() => {
        navigate("/login", {
          replace: true,
          state: { accountReady: true },
        });
      })
      .catch((err) => {
        setSaving(false);
        if (err?.response?.status === 404) {
          setStatus("invalid");
        } else {
          message.error(
            getErrorDetail(err, "We couldn’t create your account. Try again.")
          );
        }
      });
  };

  return (
    <AuthSplitLayout
      testId="invitation-register-container"
      heroAside
      aside={
        <img
          src={ImageRight}
          alt="Farmers working in the field"
          className="login-hero-image"
        />
      }
    >
      <h1 className="login-title" data-testid="invitation-title">
        Create your account
      </h1>
      <p className="login-intro-copy">
        IDH invited you to the Income Driver Calculator. Your account also gives
        you access to the Living Income Academy.
      </p>

      {status === "invalid" && <InvalidInvitation />}
      {status === "loading" && (
        <div className="invitation-loading">
          <Spin />
        </div>
      )}

      <Form
        form={form}
        name="split-form-invitation"
        className="split-form-login split-form-register"
        layout="vertical"
        requiredMark={false}
        onFinish={onFinish}
        autoComplete="off"
        hidden={status !== "ready"}
      >
        <Form.Item label="Name*" name="fullname" rules={[fullnameRule]}>
          <Input
            size="large"
            maxLength={250}
            placeholder="Olivia Rhye"
            autoComplete="name"
            data-testid="input-fullname"
          />
        </Form.Item>
        <CompanyNameField label="Organisation*" companyNames={companyNames} />
        <div className="profile-form-grid">
          <SectorField />
          <RegionField />
        </div>
        <CommoditiesField />
        <PasswordField />
        <Button
          data-testid="button-create-account"
          className="button-login"
          shape="round"
          size="large"
          type="primary"
          htmlType="submit"
          block
          loading={saving}
        >
          Get started
        </Button>
      </Form>
    </AuthSplitLayout>
  );
};

export default InvitationRegister;
