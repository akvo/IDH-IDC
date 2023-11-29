import React, { useState, useEffect, useMemo } from "react";
import "./login.scss";
import { useParams, useNavigate } from "react-router-dom";
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
import { api } from "../../lib";
import ImageRight from "../../assets/images/login-right-img.png";
import isEmpty from "lodash/isEmpty";
import LogoWhite from "../../assets/images/logo-white.png";

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [userDetail, setUserDetail] = useState({});
  const [fetchingUser, setFetchingUser] = useState(false);

  const isInvitation = window.location.pathname.includes("invitation");

  const apiUrl = useMemo(() => {
    let url = "user/";
    url += isInvitation ? "invitation" : "reset-password";
    if (!isEmpty(userDetail)) {
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
        messageApi.open({
          type: "success",
          content:
            "Password already set. Now you can login with your password.",
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
            <Form
              form={form}
              name="form-reset-password"
              className="form-login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
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
              <Form.Item>
                <Button
                  data-testid="button-login"
                  className="button-login"
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading || fetchingUser}
                >
                  {fetchingUser ? "Load user detail..." : "Save Password"}
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
      </Row>
    </ContentLayout>
  );
};

export default ResetPassword;
