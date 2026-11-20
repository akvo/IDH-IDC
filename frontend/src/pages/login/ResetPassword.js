import React, { useState, useEffect, useMemo } from "react";
import "./login.scss";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import { Button, Form, Input, Checkbox, message } from "antd";
import {
  MailOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { api } from "../../lib";
import ImageRight from "../../assets/images/reset-password-right-img.jpg";
import PasswordChangedIllustration from "../../assets/images/password-changed-illustration.svg";
import Logo from "../../assets/images/logo.png";
import isEmpty from "lodash/isEmpty";
import {
  PasswordCriteria,
  checkPasswordCriteria,
  passwordCheckBoxOptions,
  DataSecurityProvisionModal,
} from "../../components/utils";
import { CustomEvent } from "@piwikpro/react-piwik-pro";

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [userDetail, setUserDetail] = useState({});
  const [fetchingUser, setFetchingUser] = useState(false);
  const [passwordCheckList, setPasswordCheckList] = useState([]);
  const [tokenExpiredOrInvalid, setTokenExpiredOrInvalid] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  const isInvitation = window.location.pathname.includes("invitation");

  const [dataSecurityProvisionVisible, setDataSecurityProvisionVisible] =
    useState(false);
  const [agreeDataSecurityProvision, setAgreeDataSecurityProvision] = useState(
    isInvitation ? false : true
  );

  const trackEventOnClickLivingIncomeEmail = () => {
    CustomEvent.trackEvent(
      "Registration",
      "Click",
      "Clicking on Living income email from reset password",
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

  const apiUrl = useMemo(() => {
    let url = "user/";
    url += isInvitation ? "invitation" : "reset-password";
    if (!isEmpty(userDetail) && isInvitation) {
      url += `/${userDetail.invitation_id}`;
    } else {
      url += `/${tokenId}`;
    }
    return url;
  }, [isInvitation, tokenId, userDetail]);

  useEffect(() => {
    if (isEmpty(userDetail)) {
      setFetchingUser(true);
      api
        .get(apiUrl)
        .then((res) => {
          setUserDetail(res.data);
          setFetchingUser(false);
        })
        .catch(() => {
          setFetchingUser(false);
          if (isInvitation) {
            navigate("/not-found");
          } else {
            setTokenExpiredOrInvalid(true);
          }
        });
    }
  }, [apiUrl, isInvitation, navigate, userDetail]);

  const onFinishFailed = (errorInfo) => {
    const errorFields = errorInfo?.errorFields || [];
    const formValues = form.getFieldsValue();

    if (
      (formValues.password &&
        formValues.confirm &&
        formValues.password !== formValues.confirm) ||
      errorFields.some((f) => f.name?.[0] === "confirm")
    ) {
      setSubmitError("The passwords don’t match");
    } else if (errorFields.some((f) => f.name?.[0] === "password")) {
      setSubmitError("The password doesn’t meet the rules");
    }
  };

  const onFinish = (values) => {
    const { password, confirm } = values;

    if (password !== confirm) {
      setSubmitError("The passwords don’t match");
      return;
    }

    const metCriteria =
      checkPasswordCriteria(password).length === passwordCheckBoxOptions.length;
    if (!metCriteria) {
      setSubmitError("The password doesn’t meet the rules");
      return;
    }

    setLoading(true);
    setSubmitError(null);
    const payload = new FormData();
    payload.append("password", password);

    api
      .post(apiUrl, payload)
      .then(() => {
        form.resetFields();
        setPasswordCheckList([]);
        setPasswordResetSuccess(true);
      })
      .catch((err) => {
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail;
        if (status === 404 || status === 410) {
          setTokenExpiredOrInvalid(true);
        } else if (status === 400 && detail === "PASSWORD_RULES_NOT_MET") {
          setSubmitError("The password doesn’t meet the rules");
        } else {
          setSubmitError("Set password failed. Please contact your admin.");
          messageApi.open({
            type: "error",
            content: "Set password failed. Please contact your admin.",
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onChange = ({ target }) => {
    if (submitError) {
      setSubmitError(null);
    }
    if (
      target.id === "form-reset-password_password" ||
      target.getAttribute?.("data-testid") === "input-password"
    ) {
      const res = checkPasswordCriteria(target.value);
      setPasswordCheckList(res);
    }
  };

  const onValuesChange = (changedValues) => {
    if (submitError) {
      setSubmitError(null);
    }
    if ("password" in changedValues) {
      const res = checkPasswordCriteria(changedValues.password || "");
      setPasswordCheckList(res);
    }
  };

  return (
    <ContentLayout wrapperId="login">
      {contextHolder}
      <div
        className="login-split-container"
        data-testid="login-split-container"
      >
        {/* Left Pane: Reset Password Form Container */}
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
            {passwordResetSuccess ? (
              <div
                className="check-email-container"
                data-testid="password-changed-container"
              >
                <img
                  src={PasswordChangedIllustration}
                  alt="Password changed"
                  className="check-email-illustration"
                  data-testid="password-changed-illustration"
                />
                <h1
                  className="login-title"
                  data-testid="password-changed-title"
                >
                  {isInvitation ? "Password set" : "Password changed"}
                </h1>
                <p
                  className="login-intro-copy"
                  data-testid="password-changed-copy"
                >
                  {isInvitation
                    ? "Your password has been set. Log in with your new password."
                    : "Your password has been changed. Log in with your new password."}
                </p>
                <div className="check-email-actions">
                  <Link to="/login" className="button-login-link">
                    <Button
                      type="primary"
                      shape="round"
                      size="large"
                      className="button-login"
                      data-testid="button-back-to-login"
                      block
                    >
                      Back to login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h1 className="login-title" data-testid="reset-title">
                  {isInvitation ? "Set Password" : "Set a new password"}
                </h1>

                {tokenExpiredOrInvalid ? (
                  <div className="login-toast-wrapper">
                    <div
                      className="login-alert-toast toast-warning toast-reset-expired"
                      data-testid="toast-reset-expired"
                      role="alert"
                    >
                      <div className="toast-icon">
                        <WarningOutlined
                          style={{ color: "#ff5d00", fontSize: 20 }}
                        />
                      </div>
                      <div className="toast-content">
                        <p
                          className="toast-message"
                          data-testid="toast-reset-expired-message"
                        >
                          This link has expired or has already been used. For
                          your security, reset links are valid for{" "}
                          <strong>30 minutes</strong>.
                        </p>
                        <Link
                          to="/forgot-password"
                          className="toast-action-btn toast-action-warning"
                          data-testid="link-ask-new-link"
                        >
                          Ask for a new link
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Form
                      form={form}
                      name="form-reset-password"
                      className="split-form-login"
                      layout="vertical"
                      onFinish={onFinish}
                      onFinishFailed={onFinishFailed}
                      autoComplete="off"
                      onChange={onChange}
                      onValuesChange={onValuesChange}
                    >
                      <Form.Item
                        label="New password"
                        name="password"
                        rules={[
                          {
                            required: true,
                            message: "Please input your password!",
                          },
                          () => ({
                            validator(_, value) {
                              if (
                                checkPasswordCriteria(value || "").length ===
                                  passwordCheckBoxOptions.length ||
                                !value
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error("The password doesn’t meet the rules")
                              );
                            },
                          }),
                        ]}
                      >
                        <Input.Password
                          size="large"
                          data-testid="input-password"
                          placeholder="Password"
                          disabled={fetchingUser}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Confirm new password"
                        name="confirm"
                        dependencies={["password"]}
                        rules={[
                          {
                            required: true,
                            message: "Please confirm your password!",
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (
                                !value ||
                                getFieldValue("password") === value
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error("The passwords don’t match")
                              );
                            },
                          }),
                        ]}
                      >
                        <Input.Password
                          size="large"
                          data-testid="input-confirm-password"
                          placeholder="Confirm Password"
                          disabled={fetchingUser}
                        />
                      </Form.Item>

                      <div className="password-criteria-section">
                        <PasswordCriteria
                          values={passwordCheckList}
                          className="toolkit-criteria"
                        />
                      </div>

                      {isInvitation && (
                        <div className="invitation-security-row">
                          <Checkbox
                            checked={agreeDataSecurityProvision}
                            onChange={() =>
                              setAgreeDataSecurityProvision(
                                !agreeDataSecurityProvision
                              )
                            }
                            data-testid="checkbox-data-security"
                          >
                            By checking this box, I agree to the{" "}
                            <Link
                              className="link-security-provision"
                              onClick={(e) => {
                                e.preventDefault();
                                setDataSecurityProvisionVisible(true);
                              }}
                            >
                              <u>Data Security Provision</u>
                            </Link>
                            .
                          </Checkbox>
                        </div>
                      )}

                      <Form.Item noStyle>
                        <Button
                          data-testid="button-login"
                          className="button-login"
                          shape="round"
                          size="large"
                          type="primary"
                          htmlType="submit"
                          block
                          loading={loading || fetchingUser}
                          disabled={
                            fetchingUser ||
                            (isInvitation && !agreeDataSecurityProvision)
                          }
                        >
                          {fetchingUser ? "Loading..." : "Save password"}
                        </Button>
                      </Form.Item>
                    </Form>

                    {/* Inline Error Toast */}
                    {submitError && (
                      <div className="login-toast-wrapper">
                        <div
                          className="login-alert-toast toast-error"
                          data-testid="reset-error-toast"
                          role="alert"
                        >
                          <div className="toast-icon">
                            <InfoCircleOutlined
                              style={{ color: "#ff010e", fontSize: 20 }}
                            />
                          </div>
                          <div className="toast-content">
                            <p
                              className="toast-message"
                              data-testid="reset-error-message"
                            >
                              {submitError}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
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
            alt="Living Income Toolkit Reset Password"
            className="login-hero-image"
            data-testid="login-image"
          />
        </div>

        <DataSecurityProvisionModal
          visible={dataSecurityProvisionVisible}
          setVisible={setDataSecurityProvisionVisible}
          onAgree={setAgreeDataSecurityProvision}
        />
      </div>
    </ContentLayout>
  );
};

export default ResetPassword;
