import React, { useEffect, useState } from "react";
import "./login.scss";
import { Link } from "react-router-dom";
import { Button, Form, message } from "antd";
import { api } from "../../lib";
import { DataSecurityProvisionModal } from "../../components/utils";
import AuthSplitLayout from "./components/AuthSplitLayout";
import AdditionalTextBlock from "./components/AdditionalTextBlock";
import ProfileFormFields, { TermsField } from "./components/ProfileFormFields";
import LoginAlertToast from "./components/LoginAlertToast";
import { getErrorDetail, toProfilePayload, useCompanyNames } from "./utils";

// After a resend, the link to send another comes back after this long
export const RESEND_COOLDOWN_MS = 30000;

// Academy self sign-up (TLSA-015). After registering, the cleared form
// shows the "confirm your email" notice with a rate-limited resend.
const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const companyNames = useCompanyNames();

  useEffect(() => {
    if (resendSent) {
      const timer = setTimeout(() => setResendSent(false), RESEND_COOLDOWN_MS);
      return () => clearTimeout(timer);
    }
  }, [resendSent]);

  const onFinish = (values) => {
    const email = values.email.trim();
    setLoading(true);
    api
      .post("user/register-academy", { ...toProfilePayload(values), email })
      .then(() => {
        form.resetFields();
        setResendSent(false);
        setRegisteredEmail(email);
      })
      .catch((err) => {
        message.error(
          getErrorDetail(err, "Registration failed. Please try again.")
        );
      })
      .finally(() => setLoading(false));
  };

  const handleResend = () => {
    setResendLoading(true);
    api
      .post("user/resend-verification", { email: registeredEmail })
      .then(() => setResendSent(true))
      .catch((err) => {
        message.error(
          getErrorDetail(err, "We couldn’t send a new link. Please try again.")
        );
      })
      .finally(() => setResendLoading(false));
  };

  // A typo in the email: back to the form with the email to correct
  const handleChangeEmail = () => {
    form.setFieldsValue({ email: registeredEmail });
    setRegisteredEmail(null);
    setResendSent(false);
    form.getFieldInstance("email")?.focus();
  };

  return (
    <AuthSplitLayout
      testId="register-container"
      aside={<AdditionalTextBlock />}
    >
      <h1 className="login-title" data-testid="register-title">
        No account yet?
      </h1>
      <p className="login-intro-copy">
        Learn how to understand, measure and close living income gaps. Creating
        an account is free and takes a few minutes: fill in your details,
        confirm your email address, and you can start right away.
      </p>

      <Form
        form={form}
        name="split-form-register"
        className="split-form-login split-form-register"
        layout="vertical"
        requiredMark={false}
        onFinish={onFinish}
        autoComplete="off"
      >
        <ProfileFormFields companyNames={companyNames} />

        <TermsField onOpenTerms={() => setTermsOpen(true)} />

        <Button
          data-testid="button-register"
          className="button-login"
          shape="round"
          size="large"
          type="primary"
          htmlType="submit"
          block
          loading={loading}
        >
          Get started
        </Button>

        <div className="register-callout">
          <span>Already have an account?</span>
          <Link to="/login" className="link-register" data-testid="link-login">
            Log in
          </Link>
        </div>
      </Form>

      {registeredEmail && (
        <div className="login-toast-wrapper">
          <LoginAlertToast
            type="warning"
            email={registeredEmail}
            onResendLink={handleResend}
            resendLoading={resendLoading}
            resendSent={resendSent}
          >
            <div className="toast-links">
              <button
                type="button"
                className="toast-action-warning"
                onClick={handleChangeEmail}
                data-testid="button-change-email"
              >
                Use a different email address
              </button>
              <Link
                to="/login"
                className="toast-action-warning"
                data-testid="link-toast-login"
              >
                Back to log in
              </Link>
            </div>
          </LoginAlertToast>
        </div>
      )}

      <DataSecurityProvisionModal
        visible={termsOpen}
        setVisible={setTermsOpen}
        onAgree={(agreed) =>
          form.setFields([{ name: "terms", value: agreed, errors: [] }])
        }
      />
    </AuthSplitLayout>
  );
};

export default Register;
