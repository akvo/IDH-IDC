import React, { useState } from "react";
import "./login.scss";
import { useNavigate, Link, useLocation } from "react-router-dom";
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
import { CheckCircleFilled } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import { api } from "../../lib";
import UserState from "../../store/user";
import ImageRight from "../../assets/images/login-right-img.png";
import LogoWhite from "../../assets/images/logo-white.png";
import { CustomEvent } from "@piwikpro/react-piwik-pro";
import { routePath } from "../../components/route";
import { isIdcRestrictedPath } from "../../components/route/PrivateRoutes";
import { useWindowDimensions } from "../../hooks";
import { Blocker } from "../../components/utils";

const env = window?.__ENV__;
const client_id = env?.client_id || "test";
const client_secret = env?.client_secret || "test";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [, setCookie, removeCookie] = useCookies(["AUTH_TOKEN"]);
  const [messageApi, contextHolder] = message.useMessage();
  const [isResetPassword, setIsResetPassword] = useState(false);
  const { isMobile } = useWindowDimensions();

  const searchParams = new URLSearchParams(location.search);
  const isVerifiedParam = searchParams.get("verified") === "true";

  const trackEventOnClickLivingIncomeEmail = () => {
    CustomEvent.trackEvent(
      "Registration",
      "Click",
      "Clicking on Living income email for registration",
      1,
      { dimension1: "Clicked" }
    );

    // Matomo event
    if (window._paq) {
      window._paq.push([
        "trackEvent",
        "Registration",
        "Click Email Link - Living Income Email",
        "",
        1,
      ]);
      window._paq.push([
        "trackEvent",
        "Registration",
        "Click Email Link",
        "source=living_income_email",
        1,
      ]);
    }
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
        const token = data?.access_token;
        const user = data?.user;

        removeCookie("AUTH_TOKEN");
        setCookie("AUTH_TOKEN", token, { path: "/" });
        api.setToken(token);

        if (user) {
          UserState.update((s) => {
            s.id = user.id;
            s.fullname = user.fullname;
            s.email = user.email;
            s.role = user.role;
            s.active = user.active;
            s.business_unit_detail = user.business_unit_detail;
            s.organisation_detail = user.organisation_detail;
            s.tags_count = user.tags_count;
            s.cases_count = user.cases_count;
            s.case_access = user.case_access;
            s.internal_user = user.internal_user;
            s.company = user.company;
            s.company_name = user.company_name || null;
            s.user_type = user.user_type;
            s.user_profile = user.user_profile || null;
            s.isExternalRegular = user.user_type === "external_regular";
            s.isCaseCreator =
              user.role === "admin" || user.user_type === "external_advanced";
            s.tools = user.tools || [];
          });
        }

        const isSafeRedirect = (url) => {
          return (
            typeof url === "string" &&
            url.startsWith("/") &&
            !url.startsWith("//") &&
            !url.includes("\\")
          );
        };

        const currentSearchParams = new URLSearchParams(location.search);
        const redirectParam = currentSearchParams.get("redirect");
        const fromState = location.state?.from?.pathname;

        const candidatePath =
          (isSafeRedirect(redirectParam) ? redirectParam : null) ||
          (isSafeRedirect(fromState) ? fromState : null);

        const tools = user?.tools || [];
        const hasIdc = tools.includes("idc");
        const hasAcademy = tools.includes("academy");

        let targetRoute;
        const navigationState = { fromLogin: true };

        if (hasIdc) {
          targetRoute = candidatePath || routePath.idc.dashboard;
        } else if (hasAcademy) {
          if (candidatePath && !isIdcRestrictedPath(candidatePath)) {
            targetRoute = candidatePath;
          } else {
            targetRoute = routePath.academy.landing;
            if (candidatePath && isIdcRestrictedPath(candidatePath)) {
              navigationState.unauthorizedIDC = true;
            }
          }
        } else {
          targetRoute = candidatePath || routePath.idc.dashboard;
        }

        setTimeout(() => {
          navigate(targetRoute, { replace: true, state: navigationState });
        }, 50);
      })
      .catch((e) => {
        const { status, data } = e?.response || {};
        let errorMessage = "Please contact an admin.";
        if (status === 401 && data?.detail) {
          errorMessage =
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail);
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

  if (isMobile) {
    return <Blocker backRoute={routePath.idc.landing} />;
  }

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
                Better Income <br />
                <span style={{ color: "#47d985", fontSize: "2.5rem" }}>
                  Toolkit
                </span>
              </Typography.Title>
              {!isResetPassword && (
                <Typography.Title level={3}>
                  Welcome to the Better Income Toolkit
                </Typography.Title>
              )}
            </div>
            {isVerifiedParam && !isResetPassword && (
              <div
                className="verified-notification-banner"
                data-testid="alert-verified"
              >
                <CheckCircleFilled className="verified-icon" />
                <div className="verified-content">
                  <span className="verified-title">Email Verified</span>
                  <span className="verified-desc">
                    Your email has been verified successfully. Please sign in to
                    access your account.
                  </span>
                </div>
              </div>
            )}
            <h2>{!isResetPassword ? "Sign In" : "Reset Password"}</h2>
            {!isResetPassword ? (
              <div
                className="toolkit-login-guidance"
                data-testid="toolkit-login-guidance"
              >
                <p className="academy-register-callout">
                  New to the Academy?{" "}
                  <Link to="/register" data-testid="link-register-academy">
                    Register for free
                  </Link>
                </p>
                <p className="idc-request-callout">
                  Need access to the Income Driver Calculator? Contact your
                  organization administrator or email{" "}
                  <a
                    href="mailto:livingincome@idhtrade.org"
                    onClick={trackEventOnClickLivingIncomeEmail}
                  >
                    livingincome@idhtrade.org
                  </a>{" "}
                  to request an invitation.
                </p>
                <Divider style={{ borderColor: "#fff", opacity: 0.2 }} />
              </div>
            ) : null}
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
                <Row align="top" style={{ marginTop: 12 }}>
                  <Col span={24} align="end">
                    <Link
                      onClick={() => setIsResetPassword(!isResetPassword)}
                      data-testid="link-forgot-password"
                    >
                      <p style={{ margin: 0 }}>
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
