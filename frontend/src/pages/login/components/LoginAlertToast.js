import React from "react";
import { WarningOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const LoginAlertToast = ({
  type = "error",
  email,
  onResendLink,
  resendLoading = false,
  resendSent = false,
  onForgotPasswordClick,
}) => {
  if (type === "warning") {
    return (
      <div
        className="login-alert-toast toast-warning"
        data-testid="login-alert-warning"
        role="alert"
      >
        <div className="toast-icon">
          <WarningOutlined style={{ color: "#ff5d00", fontSize: 20 }} />
        </div>
        <div className="toast-content">
          {resendSent ? (
            <p className="toast-message" data-testid="toast-resend-success">
              Verification link resent! We sent a new verification link to{" "}
              <span className="toast-email-highlight">{email}</span>. Please
              check your inbox and spam folder.
            </p>
          ) : (
            <>
              <p className="toast-message">
                Please confirm your email address first. We sent a link to{" "}
                <span className="toast-email-highlight">{email}</span> when you
                signed up. Can’t find it? Check your spam folder or
              </p>
              <button
                type="button"
                className="toast-action-btn toast-action-warning"
                onClick={onResendLink}
                disabled={resendLoading}
                data-testid="button-resend-verification"
              >
                {resendLoading ? "sending link..." : "send the link again"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="login-alert-toast toast-error"
      data-testid="login-alert-error"
      role="alert"
    >
      <div className="toast-icon">
        <InfoCircleOutlined style={{ color: "#ff010e", fontSize: 20 }} />
      </div>
      <div className="toast-content">
        <p className="toast-message">
          The email address or password is not correct. Please check them and
          try again.
        </p>
        <Link
          to="/reset-password"
          onClick={(e) => {
            if (onForgotPasswordClick) {
              e.preventDefault();
              onForgotPasswordClick();
            }
          }}
          className="toast-link-error"
          data-testid="link-toast-forgot-password"
        >
          Reset your password
        </Link>
      </div>
    </div>
  );
};

export default LoginAlertToast;
