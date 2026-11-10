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
  Result,
  message,
} from "antd";
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

  const onChange = ({ target }) => {
    if (target.id === "form-registration_password") {
      const res = checkPasswordCriteria(target.value);
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
                <span style={{ color: "#47d985" }}>Academy</span>
              </Typography.Title>
            </div>

            {registeredEmail ? (
              <div
                data-testid="registration-success-container"
                style={{ padding: "20px 0" }}
              >
                <Result
                  status="success"
                  title={
                    <span style={{ color: "#fff" }}>
                      Registration Successful!
                    </span>
                  }
                  subTitle={
                    <span style={{ color: "#e6f7ff" }}>
                      We have sent a verification link to{" "}
                      <strong>{registeredEmail}</strong>. Please check your
                      inbox and click the link to activate your Living Income
                      Academy access.
                    </span>
                  }
                  extra={[
                    <Button
                      type="primary"
                      key="login"
                      data-testid="button-success-login"
                      style={{
                        backgroundColor: "#47d985",
                        borderColor: "#47d985",
                        color: "#000",
                        fontWeight: 600,
                      }}
                    >
                      <Link to={`${routePath.idc.login}?verified=pending`}>
                        Return to Sign In
                      </Link>
                    </Button>,
                  ]}
                />
              </div>
            ) : (
              <>
                <h2>Create Account</h2>
                <p style={{ color: "#e0e0e0", marginBottom: 16 }}>
                  Register to access interactive learning modules, case studies,
                  and tools.
                </p>
                <PasswordCriteria
                  values={passwordCheckList}
                  className="white"
                />
                <Form
                  form={form}
                  name="form-registration"
                  className="form-login"
                  layout="vertical"
                  onFinish={onFinish}
                  autoComplete="off"
                  onChange={onChange}
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
                    <Input data-testid="input-email" placeholder="Email" />
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
                          if (
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
                      data-testid="input-password"
                      placeholder="Password (8+ chars, upper, lower, number, symbol)"
                    />
                  </Form.Item>
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
