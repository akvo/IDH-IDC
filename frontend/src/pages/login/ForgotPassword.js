import React, { useState } from "react";
import "./login.scss";
import { Link } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import { Form, Input, Button } from "antd";
import { MailOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import ImageRight from "../../assets/images/reset-password-right-img.jpg";
import CheckEmailIllustration from "../../assets/images/check-email-illustration.svg";
import Logo from "../../assets/images/logo.png";
import { CustomEvent } from "@piwikpro/react-piwik-pro";

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

  const trackEventOnClickLivingIncomeEmail = () => {
    CustomEvent.trackEvent(
      "Registration",
      "Click",
      "Clicking on Living income email for password reset",
      1,
      { dimension1: "Clicked" }
    );

    if (window._paq) {
      window._paq.push([
        "trackEvent",
        "Registration",
        "Click Email Link - Living Income Email",
        "",
        1,
      ]);
    }
  };

  const onFinish = (values) => {
    setLoading(true);
    const { email } = values;
    const payload = new FormData();
    payload.append("email", email);

    api
      .post("user/forgot-password", payload)
      .then(() => {
        setSubmittedEmail(email);
      })
      .catch(() => {
        // Uniform anti-enumeration: always display confirmation screen
        setSubmittedEmail(email);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleResend = () => {
    if (!submittedEmail || resendLoading) {
      return;
    }
    setResendLoading(true);
    const payload = new FormData();
    payload.append("email", submittedEmail);

    api
      .post("user/forgot-password", payload)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setResendLoading(false);
      });
  };

  return (
    <ContentLayout wrapperId="login">
      <div
        className="login-split-container"
        data-testid="forgot-password-container"
      >
        {/* Left Pane: Form Container */}
        <div className="login-left-pane">
          {/* Header */}
          <div className="login-pane-header">
            <Link to="/" data-testid="logo-link" className="header-brand-link">
              <img
                src={Logo}
                alt="IDH Logo"
                className="header-logo"
                data-testid="logo-image"
              />
              <div className="header-divider" />
              <span className="header-subtitle">
                Toolkit Towards Better Incomes
              </span>
            </Link>
          </div>

          {/* Body Content */}
          <div className="login-pane-body">
            {!submittedEmail ? (
              <>
                <h1 className="login-title" data-testid="forgot-password-title">
                  Forgot your password?
                </h1>
                <p
                  className="login-intro-copy"
                  data-testid="forgot-password-copy"
                >
                  Enter the email address of your Toolkit account.
                  <br />
                  We’ll send you a link to set a new password.
                </p>

                <Form
                  form={form}
                  name="split-form-forgot-password"
                  className="split-form-login"
                  layout="vertical"
                  requiredMark={false}
                  onFinish={onFinish}
                  autoComplete="off"
                >
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      {
                        type: "email",
                        message: "The input is not valid Email",
                      },
                      {
                        required: true,
                        message: "Please input your email!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      data-testid="input-email"
                      placeholder="olivia@idh.com"
                    />
                  </Form.Item>

                  <Form.Item noStyle>
                    <Button
                      data-testid="button-send-link"
                      className="button-login"
                      shape="round"
                      size="large"
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                    >
                      Send reset link
                    </Button>
                  </Form.Item>

                  <div className="forgot-back-row">
                    <Link
                      to="/login"
                      className="link-back-login"
                      data-testid="link-back-to-login"
                    >
                      Back to log in
                    </Link>
                  </div>
                </Form>
              </>
            ) : (
              <div
                className="check-email-container"
                data-testid="check-email-container"
              >
                <img
                  src={CheckEmailIllustration}
                  alt="Check your email"
                  className="check-email-illustration"
                  data-testid="check-email-illustration"
                />
                <h1 className="login-title" data-testid="check-email-title">
                  Check your email
                </h1>
                <p className="login-intro-copy" data-testid="check-email-copy">
                  If there is an account with{" "}
                  <strong className="toast-email-highlight">
                    {submittedEmail}
                  </strong>
                  , we’ve sent a link to reset your password. The link is valid
                  for <strong>30 minutes</strong>.
                </p>

                <div className="check-email-actions">
                  <Link
                    to="/login"
                    className="button-login-link"
                    data-testid="button-back-to-login"
                  >
                    <Button
                      className="button-login"
                      shape="round"
                      size="large"
                      type="primary"
                      block
                    >
                      Back to log in
                    </Button>
                  </Link>

                  <div className="resend-link-row">
                    <button
                      type="button"
                      className="link-send-again"
                      onClick={handleResend}
                      disabled={resendLoading}
                      data-testid="button-resend-link"
                    >
                      {resendLoading
                        ? "Sending link..."
                        : "Send the link again"}
                    </button>
                  </div>
                </div>

                <div
                  className="login-alert-toast toast-success forgot-feedback-toast"
                  data-testid="forgot-password-success-toast"
                  role="alert"
                >
                  <div className="toast-icon">
                    <CheckCircleOutlined
                      style={{ color: "#49d985", fontSize: 20 }}
                    />
                  </div>
                  <div className="toast-content">
                    <p
                      className="toast-message"
                      data-testid="forgot-password-success-message"
                    >
                      Can’t find the email? Check your spam folder or click{" "}
                      <button
                        type="button"
                        className="toast-action-btn"
                        onClick={handleResend}
                        disabled={resendLoading}
                      >
                        send the link again
                      </button>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="login-pane-footer">
            <span className="footer-copyright">© IDH 2026</span>
            <a
              href="mailto:livingincome@idhtrade.org"
              className="footer-email-link"
              onClick={trackEventOnClickLivingIncomeEmail}
            >
              <MailOutlined className="footer-email-icon" />
              <span>livingincome@idhtrade.org</span>
            </a>
          </div>
        </div>

        {/* Right Pane: Hero Imagery */}
        <div
          className="login-right-pane"
          data-testid="forgot-password-image-wrapper"
        >
          <img
            src={ImageRight}
            alt="Living Income Toolkit Reset Password"
            className="login-hero-image"
            data-testid="forgot-password-image"
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default ForgotPassword;
