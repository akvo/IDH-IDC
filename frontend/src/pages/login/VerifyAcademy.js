import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import { Spin, Button } from "antd";
import { CloseCircleFilled, MailOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import ImageRight from "../../assets/images/login-right-img.jpg";
import Logo from "../../assets/images/logo.png";
import VerifiedIllustration from "../../assets/images/account-verified-illustration.png";
import { routePath } from "../../components/route";
import "./login.scss";

const VerifyAcademy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");

    if (!token || !token.trim()) {
      setStatus("error");
      setErrorMessage("Verification token is missing.");
      return;
    }

    api
      .get("user/verify-academy", { params: { token } })
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        const detail =
          err?.response?.data?.detail ||
          "Invalid or expired verification token.";
        setErrorMessage(detail);
      });
  }, [location.search]);

  return (
    <ContentLayout wrapperId="login">
      <div
        className="login-split-container"
        data-testid="login-split-container"
      >
        {/* Left Pane: Onboarding Container */}
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
            {status === "loading" && (
              <div
                style={{ padding: "40px 0", textAlign: "center" }}
                data-testid="verify-loading"
              >
                <Spin size="large" />
                <p
                  style={{
                    marginTop: 16,
                    color: "#01625f",
                    fontSize: 16,
                    fontFamily: "TabletGothic, sans-serif",
                  }}
                >
                  Verifying your Living Income Academy account...
                </p>
              </div>
            )}

            {status === "success" && (
              <div
                className="verified-success-card"
                data-testid="verify-success"
              >
                <div className="verified-illustration-wrapper">
                  <img
                    src={VerifiedIllustration}
                    alt="Your account is verified"
                    className="verified-illustration"
                    data-testid="verified-illustration"
                  />
                </div>
                <h1 className="verified-title" data-testid="verified-title">
                  Your account <br />
                  is verified
                </h1>
                <Button
                  size="large"
                  type="primary"
                  className="button-login button-verified"
                  data-testid="button-go-login"
                  onClick={() => navigate(routePath.idc.login)}
                  block
                >
                  Log in
                </Button>
              </div>
            )}

            {status === "error" && (
              <div
                className="verified-success-card verified-error-card"
                data-testid="verify-error"
              >
                <CloseCircleFilled
                  style={{
                    fontSize: 54,
                    color: "#ff010e",
                    marginBottom: 20,
                  }}
                />
                <h1 className="verified-title" style={{ fontSize: 28 }}>
                  Verification Failed
                </h1>
                <p
                  style={{
                    fontFamily: "TabletGothic, sans-serif",
                    fontSize: 14,
                    color: "#666",
                    marginBottom: 24,
                  }}
                >
                  {errorMessage}
                </p>
                <Link to="/register" style={{ width: "100%" }}>
                  <Button
                    size="large"
                    type="primary"
                    className="button-login"
                    data-testid="button-back-register"
                    block
                  >
                    Register Again
                  </Button>
                </Link>
                <div style={{ marginTop: 14, width: "100%" }}>
                  <Link to={routePath.idc.login} style={{ width: "100%" }}>
                    <Button
                      size="large"
                      className="button-login"
                      data-testid="button-back-login"
                      block
                      style={{
                        background: "transparent",
                        borderColor: "#01625f",
                        color: "#01625f",
                      }}
                    >
                      Return to Log in
                    </Button>
                  </Link>
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
            >
              <MailOutlined className="footer-email-icon" />
              <span>livingincome@idhtrade.org</span>
            </a>
          </div>
        </div>

        {/* Right Pane: Hero Imagery */}
        <div className="login-right-pane" data-testid="login-image-wrapper">
          <img
            src={ImageRight}
            alt="Living Income Academy & Toolkit collaboration"
            className="login-hero-image"
            data-testid="login-image"
          />
        </div>
      </div>
    </ContentLayout>
  );
};

export default VerifyAcademy;
