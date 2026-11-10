import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import { Row, Col, Typography, Image, Spin, Button } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { api } from "../../lib";
import ImageRight from "../../assets/images/login-right-img.png";
import LogoWhite from "../../assets/images/logo-white.png";
import { routePath } from "../../components/route";
import "./login.scss";

const VerifyAcademy = () => {
  const location = useLocation();
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
      <Row align="middle" className="login-container">
        <Col span={12} align="start" className="login-form-wrapper">
          <Image
            src={LogoWhite}
            height={55}
            preview={false}
            data-testid="logo-image"
          />
          <Col span={24} align="center" className="login-form">
            <div className="page-title-container">
              <Typography.Title>
                Living Income <br />
                <span style={{ color: "#47d985", fontSize: "2.5rem" }}>
                  Academy
                </span>
              </Typography.Title>
              <Typography.Title level={3}>
                Account Verification
              </Typography.Title>
            </div>

            {status === "loading" && (
              <div
                style={{ padding: "40px 0", textAlign: "center" }}
                data-testid="verify-loading"
              >
                <Spin size="large" />
                <p style={{ marginTop: 16, color: "#fff", fontSize: 16 }}>
                  Verifying your Living Income Academy account...
                </p>
              </div>
            )}

            {status === "success" && (
              <div
                className="registration-feedback-view"
                data-testid="verify-success"
              >
                <CheckCircleFilled
                  style={{
                    fontSize: 54,
                    color: "#47d985",
                    marginBottom: 20,
                  }}
                />
                <h2>Account Verified Successfully!</h2>
                <p className="feedback-description">
                  Your Living Income Academy account is now active. You may now
                  sign in to begin learning.
                </p>
                <Link to={`${routePath.idc.login}?verified=true`}>
                  <Button
                    size="large"
                    type="primary"
                    className="button-login"
                    data-testid="button-go-login"
                    block
                  >
                    Sign In Now
                  </Button>
                </Link>
              </div>
            )}

            {status === "error" && (
              <div
                className="registration-feedback-view"
                data-testid="verify-error"
              >
                <CloseCircleFilled
                  style={{
                    fontSize: 54,
                    color: "#ff4d4f",
                    marginBottom: 20,
                  }}
                />
                <h2>Verification Failed</h2>
                <p className="feedback-description">{errorMessage}</p>
                <Link to="/register">
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
                <div style={{ marginTop: 14 }}>
                  <Link to={routePath.idc.login}>
                    <Button
                      size="large"
                      className="button-secondary"
                      data-testid="button-back-login"
                      block
                      style={{
                        background: "transparent",
                        borderColor: "rgba(255, 255, 255, 0.4)",
                        color: "#fff",
                        borderRadius: 20,
                      }}
                    >
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Col>
        </Col>
        <Col
          span={12}
          align="end"
          data-testid="login-image-wrapper"
          className="login-image-wrapper"
        >
          <Image
            src={ImageRight}
            preview={false}
            className="login-image"
            data-testid="login-image"
          />
        </Col>
      </Row>
    </ContentLayout>
  );
};

export default VerifyAcademy;
