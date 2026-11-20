import React, { useState } from "react";
import "./login.scss";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import { Form, Input, Button, Checkbox, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import { api } from "../../lib";
import UserState from "../../store/user";
import ImageRight from "../../assets/images/login-right-img.jpg";
import Logo from "../../assets/images/logo.png";
import { CustomEvent } from "@piwikpro/react-piwik-pro";
import { routePath } from "../../components/route";
import { isIdcRestrictedPath } from "../../components/route/PrivateRoutes";
import LoginAlertToast from "./components/LoginAlertToast";
import VerifiedSuccessCard from "./components/VerifiedSuccessCard";

const env = window?.__ENV__;
const client_id = env?.client_id || "test";
const client_secret = env?.client_secret || "test";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [, , removeCookie] = useCookies(["AUTH_TOKEN"]);
  const [messageApi, contextHolder] = message.useMessage();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [inputError, setInputError] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const isVerifiedParam = searchParams.get("verified") === "true";
  const [showVerifiedCard, setShowVerifiedCard] = useState(isVerifiedParam);

  const [alertState, setAlertState] = useState(() => {
    if (
      searchParams.get("passwordChanged") === "true" ||
      location.state?.passwordChanged
    ) {
      return {
        type: "success",
        message:
          "Your password has been changed. Log in with your new password.",
      };
    }
    return null;
  });

  const trackEventOnClickLivingIncomeEmail = () => {
    CustomEvent.trackEvent(
      "Registration",
      "Click",
      "Clicking on Living income email for registration",
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
      window._paq.push([
        "trackEvent",
        "Registration",
        "Click Email Link",
        "source=living_income_email",
        1,
      ]);
    }
  };

  const handleResendVerification = () => {
    if (!alertState?.email) {
      return;
    }
    setResendLoading(true);
    api
      .post("user/resend-academy-verification", { email: alertState.email })
      .then(() => {
        setResendSent(true);
        messageApi.open({
          type: "success",
          content: "Verification link has been resent to your email.",
        });
      })
      .catch((err) => {
        messageApi.open({
          type: "error",
          content:
            err?.response?.data?.detail ||
            "Failed to resend verification link. Please try again.",
        });
      })
      .finally(() => {
        setResendLoading(false);
      });
  };

  const onFinish = (values) => {
    setLoading(true);
    setAlertState(null);
    setInputError(false);

    const { email, password, remember_me } = values;
    const payload = new FormData();
    payload.append("grant_type", "password");
    payload.append("username", email);
    payload.append("password", password);
    payload.append("scope", "openid email");
    payload.append("client_id", client_id);
    payload.append("client_secret", client_secret);
    payload.append("remember_me", remember_me ? "true" : "false");

    api
      .post("user/login", payload)
      .then((res) => {
        const { data } = res;
        const token = data?.access_token;
        const user = data?.user;

        removeCookie("AUTH_TOKEN", { path: "/" });
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
            s.isAuthenticated = true;
            s.authInitializing = false;
          });
        } else {
          UserState.update((s) => {
            s.isAuthenticated = true;
            s.authInitializing = false;
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
        const originParam = currentSearchParams.get("from");
        const redirectParam = currentSearchParams.get("redirect");
        const fromState = location.state?.from?.pathname;

        const tools = user?.tools || [];
        const hasIdc = tools.includes("idc");
        const hasAcademy = tools.includes("academy");

        const navigationState = { fromLogin: true };
        let targetRoute;

        // Origin classification
        const isFromIdcLanding =
          originParam === "idc_landing" ||
          originParam === routePath.idc.landing ||
          originParam === "/income-driver-calculator" ||
          redirectParam === routePath.idc.landing ||
          redirectParam === "/income-driver-calculator";

        const isFromAcademy =
          originParam === "academy_landing" ||
          originParam === "/academy" ||
          (typeof originParam === "string" &&
            originParam.startsWith("/academy/")) ||
          redirectParam === "/academy" ||
          (typeof redirectParam === "string" &&
            redirectParam.startsWith("/academy/")) ||
          (typeof fromState === "string" &&
            (fromState === "/academy" || fromState.startsWith("/academy/")));

        const isFromToolkitLanding =
          originParam === "toolkit_landing" ||
          originParam === "/" ||
          redirectParam === "/" ||
          fromState === "/";

        const candidateDeepLink =
          (isSafeRedirect(redirectParam) &&
          redirectParam !== routePath.idc.landing &&
          redirectParam !== "/income-driver-calculator" &&
          redirectParam !== "/" &&
          redirectParam !== "/academy"
            ? redirectParam
            : null) ||
          (isSafeRedirect(fromState) &&
          fromState !== routePath.idc.landing &&
          fromState !== "/income-driver-calculator" &&
          fromState !== "/" &&
          fromState !== "/academy"
            ? fromState
            : null);

        if (candidateDeepLink) {
          // Specific deep link workflow
          if (hasIdc) {
            targetRoute = candidateDeepLink;
          } else if (isIdcRestrictedPath(candidateDeepLink)) {
            // Academy-only user attempting to access restricted IDC path
            targetRoute = routePath.academy.landing;
            navigationState.unauthorizedIDC = true;
          } else {
            targetRoute = candidateDeepLink;
          }
        } else if (isFromIdcLanding) {
          if (hasIdc) {
            targetRoute = routePath.idc.dashboard;
          } else {
            // Academy-only user logging in from IDC landing -> navigate to Toolkit Home with modal prompt
            targetRoute = "/";
            navigationState.unauthorizedIDC = true;
          }
        } else if (isFromAcademy) {
          targetRoute = routePath.academy.overview;
        } else if (isFromToolkitLanding) {
          targetRoute = "/";
        } else {
          // Default fallbacks when no origin specified
          if (hasIdc) {
            targetRoute = routePath.idc.dashboard;
          } else if (hasAcademy) {
            targetRoute = routePath.academy.landing;
          } else {
            targetRoute = "/";
          }
        }

        setTimeout(() => {
          navigate(targetRoute, { replace: true, state: navigationState });
        }, 50);
      })
      .catch((e) => {
        const { status, data } = e?.response || {};

        if (status === 401 && data?.error_code === "ACCOUNT_NOT_VERIFIED") {
          setInputError(false);
          setAlertState({
            type: "warning",
            email: data.email || email,
          });
        } else {
          setInputError(true);
          setAlertState({
            type: "error",
          });
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
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <ContentLayout wrapperId="login">
      {contextHolder}
      <div
        className="login-split-container"
        data-testid="login-split-container"
      >
        {/* Left Pane: Onboarding Form Container */}
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
            {showVerifiedCard ? (
              <VerifiedSuccessCard
                onProceedToLogin={() => setShowVerifiedCard(false)}
              />
            ) : (
              <>
                <h1 className="login-title" data-testid="login-title">
                  Log in
                </h1>

                <Form
                  name="split-form-login"
                  className={`split-form-login ${
                    inputError ? "has-input-error" : ""
                  }`}
                  layout="vertical"
                  requiredMark={false}
                  onFinish={onFinish}
                  autoComplete="off"
                  onValuesChange={() => {
                    if (inputError) {
                      setInputError(false);
                    }
                    if (alertState && alertState.type !== "success") {
                      setAlertState(null);
                    }
                  }}
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
                      placeholder="Email"
                      className={inputError ? "input-error" : ""}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Password"
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
                      className={inputError ? "input-error" : ""}
                    />
                  </Form.Item>

                  <div className="login-options-row">
                    <Form.Item
                      name="remember_me"
                      valuePropName="checked"
                      initialValue={true}
                      noStyle
                    >
                      <Checkbox data-testid="checkbox-remember-me">
                        Remember for 30 days
                      </Checkbox>
                    </Form.Item>

                    <Link
                      to="/forgot-password"
                      data-testid="link-forgot-password"
                      className="link-forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </div>

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
                      Log in
                    </Button>
                  </Form.Item>

                  <div className="register-callout">
                    <span>New to the Toolkit?</span>
                    <Link
                      to="/register"
                      className="link-register"
                      data-testid="link-register-academy"
                    >
                      Register for free
                    </Link>
                  </div>
                </Form>

                {/* Inline Alert / Toast */}
                {alertState && (
                  <div className="login-toast-wrapper">
                    <LoginAlertToast
                      type={alertState.type}
                      email={alertState.email}
                      message={alertState.message}
                      onResendLink={handleResendVerification}
                      resendLoading={resendLoading}
                      resendSent={resendSent}
                    />
                  </div>
                )}
              </>
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

export default Login;
