import React, { useState } from "react";
import "./login.scss";
import { Link } from "react-router-dom";
import { ContentLayout } from "../../components/layout";
import {
  Row,
  Col,
  Button,
  Form,
  Input,
  Typography,
  Image,
  Checkbox,
  message,
} from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { api } from "../../lib";
import ImageRight from "../../assets/images/login-right-img.png";
import LogoWhite from "../../assets/images/logo-white.png";
import {
  PasswordCriteria,
  checkPasswordCriteria,
  passwordCheckBoxOptions,
} from "../../components/utils";
import { DataSecurityProvisionModal } from "../../components/utils";
import { routePath } from "../../components/route";

const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [passwordCheckList, setPasswordCheckList] = useState([]);
  const [dataSecurityProvisionVisible, setDataSecurityProvisionVisible] =
    useState(false);
  const [agreeDataSecurityProvision, setAgreeDataSecurityProvision] =
    useState(false);

  const onFinish = (values) => {
    setLoading(true);
    const { fullname, email, password, company_name } = values;

    api
      .post("user/register-academy", {
        fullname,
        email,
        password,
        company_name,
      })
      .then(() => {
        form.resetFields();
        setPasswordCheckList([]);
        setRegisteredEmail(email);
        messageApi.open({
          type: "success",
          content:
            "Registration successful! Please check your email to verify your account.",
        });
      })
      .catch((e) => {
        let content = "Registration failed. Please try again.";
        const detail = e?.response?.data?.detail;
        if (detail) {
          content = detail;
        }
        messageApi.open({
          type: "error",
          content: content,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onValuesChange = (changedValues) => {
    if ("password" in changedValues) {
      const res = checkPasswordCriteria(changedValues.password || "");
      setPasswordCheckList(res);
    }
  };

  const onChange = ({ target }) => {
    if (
      target.id === "form-registration_password" ||
      target.getAttribute?.("data-testid") === "input-password"
    ) {
      const res = checkPasswordCriteria(target.value || "");
      setPasswordCheckList(res);
    }
  };

  return (
    <ContentLayout wrapperId="login">
      {contextHolder}
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
                Welcome to the Living Income Academy
              </Typography.Title>
            </div>

            {registeredEmail ? (
              <div
                className="registration-feedback-view"
                data-testid="registration-success-container"
              >
                <CheckCircleFilled
                  style={{
                    fontSize: 54,
                    color: "#47d985",
                    marginBottom: 20,
                  }}
                />
                <h2>Registration Successful!</h2>
                <p className="feedback-description">
                  We have sent a verification link to{" "}
                  <strong style={{ color: "#47d985", fontWeight: 700 }}>
                    {registeredEmail}
                  </strong>
                  .
                  <br />
                  Please check your inbox and click the link to activate your
                  Living Income Academy access.
                </p>
                <p className="feedback-hint">
                  Didn&apos;t receive the email? Check your spam folder or wait
                  a few minutes.
                </p>
                <Link to={`${routePath.idc.login}?verified=pending`}>
                  <Button
                    size="large"
                    type="primary"
                    className="button-login"
                    data-testid="button-success-login"
                    block
                  >
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <h2>Create Account</h2>
                <p
                  style={{
                    color: "#e0e0e0",
                    fontSize: "0.95rem",
                    marginBottom: 24,
                  }}
                >
                  Register to access interactive learning modules, case studies,
                  and tools.
                </p>
                <Form
                  form={form}
                  name="form-registration"
                  className="form-login"
                  layout="vertical"
                  onFinish={onFinish}
                  autoComplete="off"
                  onChange={onChange}
                  onValuesChange={onValuesChange}
                >
                  <Form.Item
                    name="fullname"
                    rules={[
                      {
                        required: true,
                        message: "Please input your fullname!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      data-testid="input-fullname"
                      placeholder="Fullname"
                    />
                  </Form.Item>
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
                    name="company_name"
                    rules={[
                      {
                        required: true,
                        message:
                          "Please input your Organization / Company name!",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      data-testid="input-company-name"
                      placeholder="Organization / Company Name"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Please input your password!",
                      },
                      () => ({
                        validator(_, value) {
                          const meetsCriteria =
                            checkPasswordCriteria(value || "").length ===
                            passwordCheckBoxOptions.length;
                          if (
                            meetsCriteria ||
                            passwordCheckList.length ===
                              passwordCheckBoxOptions.length ||
                            !value
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Please follow password criteria rule")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      size="large"
                      data-testid="input-password"
                      placeholder="Password (8+ chars, upper, lower, number, symbol)"
                    />
                  </Form.Item>

                  <PasswordCriteria
                    values={passwordCheckList}
                    className="white compact"
                  />

                  <Form.Item
                    name="confirm"
                    dependencies={["password"]}
                    rules={[
                      {
                        required: true,
                        message: "Please confirm your password!",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error(
                              "Confirm Password that you entered do not match!"
                            )
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      size="large"
                      data-testid="input-confirm-password"
                      placeholder="Confirm Password"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Checkbox
                      style={{ width: "100%", color: "#fff" }}
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
                        className="copyright-text"
                        style={{ color: "#fff" }}
                        onClick={() => setDataSecurityProvisionVisible(true)}
                      >
                        <u>Data Security Provision</u>
                      </Link>
                      .
                    </Checkbox>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      size="large"
                      data-testid="button-register"
                      className={`button-login ${
                        !agreeDataSecurityProvision ? "disabled" : ""
                      }`}
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      disabled={!agreeDataSecurityProvision}
                    >
                      Register
                    </Button>
                  </Form.Item>
                  <Form.Item noStyle>
                    <p>
                      Already have an account?{" "}
                      <Link to={routePath.idc.login}>Login here.</Link>
                    </p>
                  </Form.Item>
                </Form>
              </>
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

        <DataSecurityProvisionModal
          visible={dataSecurityProvisionVisible}
          setVisible={setDataSecurityProvisionVisible}
          onAgree={setAgreeDataSecurityProvision}
        />
      </Row>
    </ContentLayout>
  );
};

export default Register;
