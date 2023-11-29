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
} from "antd";
import { useCookies } from "react-cookie";
import { api } from "../../lib";
import ImageRight from "../../assets/images/login-right-img.png";
import LogoWhite from "../../assets/images/logo-white.png";

const env = window?.__ENV__;
const client_id = env?.client_id || "test";
const client_secret = env?.client_secret || "test";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies(["AUTH_TOKEN"]);
  const [messageApi, contextHolder] = message.useMessage();

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
              <Typography.Title level={3}>
                Welcome to the income driver calculator version 2.0
              </Typography.Title>
            </div>
            <h2>Sign In</h2>
            <Form
              name="form-login"
              className="form-login"
              layout="vertical"
              onFinish={onFinish}
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
              <Form.Item>
                <Button
                  data-testid="button-login"
                  className="button-login"
                  size="large"
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                >
                  Sign in
                </Button>
              </Form.Item>
              <Form.Item noStyle>
                <p>
                  Don&apos;t have an account?{" "}
                  <Link to="/register">Register here.</Link>
                </p>
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
