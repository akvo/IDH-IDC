import React, { useState } from "react";
import "./login.scss";
import { useNavigate, Link } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import {
  Row,
  Col,
  Button,
  Form,
  Input,
  Typography,
  Image,
  message,
  Divider,
} from "antd";
import { useCookies } from "react-cookie";
import { api } from "../../lib";
import ImageRight from "../../assets/images/login-right-img.png";
import LogoWhite from "../../assets/images/logo-white.png";
import { CustomEvent } from "@piwikpro/react-piwik-pro";

const env = window?.__ENV__;
const client_id = env?.client_id || "test";
const client_secret = env?.client_secret || "test";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies(["AUTH_TOKEN"]);
  const [messageApi, contextHolder] = message.useMessage();
  const [isResetPassword, setIsResetPassword] = useState(false);

  const trackEventOnClickLivingIncomeEmail = () => {
    CustomEvent.trackEvent(
      "Registration",
      "Click",
      "Clicking on Living income email for registration",
      1,
      { dimension1: "Clicked" }
    );
  };

  const onFinish = (values) => {
    setLoading(true);
    const { email, password } = values;
    const payload = new FormData();
    payload.append("grant_type", "password");
    payload.append("username", email);
    payload.append("password", password);
    payload.append("scope", "openid email");
    payload.append("client_id", client_id);
    payload.append("client_secret", client_secret);

    api
      .post("user/login", payload)
      .then((res) => {
        const { data } = res;
        removeCookie("AUTH_TOKEN");
        setCookie("AUTH_TOKEN", data?.access_token);
        api.setToken(cookies?.AUTH_TOKEN);
        setTimeout(() => {
          navigate("/welcome");
        }, 100);
      })
      .catch((e) => {
        const { status, data } = e.response;
        let errorMessage = "Please contact an admin.";
        if (status === 401) {
          errorMessage = data.detail;
        }
        messageApi.open({
          type: "error",
          content: `Login failed. ${errorMessage}`,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleForgotPassword = (values) => {
    setLoading(true);
    const { email } = values;
    const payload = new FormData();
    payload.append("email", email);
    api
      .post(`user/forgot-password`, payload)
      .then(() => {
        messageApi.open({
          type: "success",
          content:
            "Reset Password link has been sent to your email. Please use the link to reset your password.",
        });
      })
      .catch(() => {
        messageApi.open({
          type: "error",
          content: "Email not found",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <ContentLayout wrapperId="login">
      {contextHolder}
      <Row align="middle" className="login-container">
        <Col span={12} className="login-form-wrapper">
          <Image
            src={LogoWhite}
            height={55}
            preview={false}
            data-testid="logo-image"
          />
          <Col span={24} align="center" className="login-form">
            <div className="page-title-container">
              <Typography.Title>
                Income Driver <br />
                <span style={{ color: "#47d985" }}>Calculator</span>
              </Typography.Title>
              {!isResetPassword && (
                <Typography.Title level={3}>
                  Welcome to the income driver calculator version 2.0
                </Typography.Title>
              )}
            </div>
            <h2>{!isResetPassword ? "Sign In" : "Reset Password"}</h2>
            {!isResetPassword ? (
              <div style={{ padding: "0 10px" }}>
                <p>
                  For registration, please reach out to your IDH point of
                  contact or email us at{" "}
                  <a
                    href="mailto:someone@example.com"
                    onClick={trackEventOnClickLivingIncomeEmail}
                  >
                    livingincome@idhtrade.org
                  </a>
                </p>
                <Divider style={{ borderColor: "#fff", opacity: 0.2 }} />
              </div>
            ) : (
              ""
            )}
            <Form
              name="form-login"
              className="form-login"
              layout="vertical"
              onFinish={!isResetPassword ? onFinish : handleForgotPassword}
              autoComplete="off"
            >
              <Form.Item
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
                  placeholder="Email"
                />
              </Form.Item>
              {!isResetPassword && (
                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your password!",
                    },
                  ]}
                >
                  <Input.Password
                    size="large"
                    data-testid="input-password"
                    placeholder="Password"
                  />
                </Form.Item>
              )}
              <Form.Item noStyle>
                <Button
                  data-testid="button-login"
                  className="button-login"
                  size="large"
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                >
                  {!isResetPassword ? "Sign In" : "Reset Password"}
                </Button>
              </Form.Item>
              <Form.Item noStyle>
                <Row align="top">
                  {/* <Col span={12} align="start" style={{ float: "left" }}>
                    <p>
                      Don&apos;t have an account?{" "}
                      <Link to="/register">Register here.</Link>
                    </p>
                  </Col> */}
                  <Col span={24} align="end" style={{ float: "right" }}>
                    <Link onClick={() => setIsResetPassword(!isResetPassword)}>
                      <p>
                        {!isResetPassword ? "Forgot password" : "Back to Login"}
                      </p>
                    </Link>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
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

export default Login;
