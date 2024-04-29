import React, { useState, useEffect, useMemo } from "react";
import "./login.scss";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Checkbox,
} from "antd";
import { api } from "../../lib";
import ImageRight from "../../assets/images/login-right-img.png";
import isEmpty from "lodash/isEmpty";
import LogoWhite from "../../assets/images/logo-white.png";
import {
  PasswordCriteria,
  checkPasswordCriteria,
} from "../../components/utils";
import { DataSecurityProvisionModal } from "../../components/utils";

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [userDetail, setUserDetail] = useState({});
  const [fetchingUser, setFetchingUser] = useState(false);
  const [passwordCheckList, setPasswordCheckList] = useState([]);

  const isInvitation = window.location.pathname.includes("invitation");

  const [dataSecurityProvisionVisible, setDataSecurityProvisionVisible] =
    useState(false);
  const [agreeDataSecurityProvision, setAgreeDataSecurityProvision] = useState(
    isInvitation ? false : true
  );

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
        .catch((e) => {
          console.error(e);
          navigate("/not-found");
        });
    }
  }, [apiUrl, navigate, userDetail]);

  const onFinish = (values) => {
    setLoading(true);
    const { password } = values;
    const payload = new FormData();
    payload.append("password", password);
    api
      .post(apiUrl, payload)
      .then(() => {
        form.resetFields();
        setPasswordCheckList([]);
        messageApi.open({
          type: "success",
          content:
            "Password already set. Now you can login with your new password.",
        });
        setTimeout(() => {
          navigate("/login");
        }, 300);
      })
      .catch(() => {
        messageApi.open({
          type: "error",
          content: "Set password failed. Please contact your admin.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onChange = ({ target }) => {
    if (target.id === "form-reset-password_password") {
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
                Income Driver <br />
                <span style={{ color: "#47d985" }}>Calculator</span>
              </Typography.Title>
            </div>
            <h2>Set Password</h2>
            <PasswordCriteria values={passwordCheckList} className="white" />
            <Form
              form={form}
              name="form-reset-password"
              className="form-login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              onChange={onChange}
            >
              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Please input your password!",
                  },
                  () => ({
                    validator(_, value) {
                      if (passwordCheckList.length === 4 || !value) {
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
                  placeholder="Password"
                  disabled={fetchingUser}
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
                  disabled={fetchingUser}
                />
              </Form.Item>

              {isInvitation && (
                <Form.Item>
                  <Checkbox
                    style={{ width: "100%", color: "#fff" }}
                    checked={agreeDataSecurityProvision}
                    onChange={() =>
                      setAgreeDataSecurityProvision(!agreeDataSecurityProvision)
                    }
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
              )}

              <Form.Item>
                <Button
                  data-testid="button-login"
                  className={`button-login ${
                    !agreeDataSecurityProvision ? "disabled" : ""
                  }`}
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading || fetchingUser}
                  disabled={!agreeDataSecurityProvision}
                >
                  {fetchingUser ? "Loading..." : "Save Password"}
                </Button>
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

        <DataSecurityProvisionModal
          visible={dataSecurityProvisionVisible}
          setVisible={setDataSecurityProvisionVisible}
          onAgree={setAgreeDataSecurityProvision}
        />
      </Row>
    </ContentLayout>
  );
};

export default ResetPassword;
