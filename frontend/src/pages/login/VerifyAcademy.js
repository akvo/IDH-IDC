import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import { Row, Col, Typography, Image, Spin, Result, Button } from "antd";
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
                <span style={{ color: "#47d985" }}>Academy</span>
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
              <div data-testid="verify-success" style={{ padding: "20px 0" }}>
                <Result
                  status="success"
                  title={
                    <span style={{ color: "#fff" }}>
                      Account Verified Successfully!
                    </span>
                  }
                  subTitle={
                    <span style={{ color: "#e6f7ff" }}>
                      Your Living Income Academy account is now active. You may
                      now sign in to begin learning.
                    </span>
                  }
                  extra={[
                    <Button
                      type="primary"
                      key="login"
                      data-testid="button-go-login"
                      style={{
                        backgroundColor: "#47d985",
                        borderColor: "#47d985",
                        color: "#000",
                        fontWeight: 600,
                      }}
                    >
                      <Link to={`${routePath.idc.login}?verified=true`}>
                        Sign In Now
                      </Link>
                    </Button>,
                  ]}
                />
              </div>
            )}

            {status === "error" && (
              <div data-testid="verify-error" style={{ padding: "20px 0" }}>
                <Result
                  status="error"
                  title={
                    <span style={{ color: "#fff" }}>Verification Failed</span>
                  }
                  subTitle={
                    <span style={{ color: "#ffccc7" }}>{errorMessage}</span>
                  }
                  extra={[
                    <Button
                      type="primary"
                      key="retry"
                      data-testid="button-back-register"
                      style={{
                        backgroundColor: "#47d985",
                        borderColor: "#47d985",
                        color: "#000",
                        fontWeight: 600,
                        marginRight: 8,
                      }}
                    >
                      <Link to="/register">Register Again</Link>
                    </Button>,
                    <Button key="login" data-testid="button-back-login">
                      <Link to={routePath.idc.login}>Return to Sign In</Link>
                    </Button>,
                  ]}
                />
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
