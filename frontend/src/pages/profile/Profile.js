import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Tag,
  Avatar,
  Alert,
  message,
} from "antd";
import { UserState, UIState } from "../../store";
import { api } from "../../lib";
import { ContentLayout } from "../../components/layout";
import {
  PasswordCriteria,
  checkPasswordCriteria,
} from "../../components/utils";
import { routePath } from "../../components/route";
import { getUserInitials } from "../../pages/academy/utils";
import {
  IncompleteProfileAlert,
  isUserProfileIncomplete,
  getProfileAlertStorageKey,
} from "../../components/profile";
import "./Profile.scss";

const Profile = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const userState = UserState.useState((s) => s);
  const companyOptions = UIState.useState((s) => s.companyOptions);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordCriteria, setPasswordCriteria] = useState([]);

  const userTools = useMemo(
    () => (Array.isArray(userState?.tools) ? userState.tools : []),
    [userState?.tools]
  );
  const isIdcUser = userTools.includes("idc");

  const companyDisplay = useMemo(() => {
    if (userState?.company_name) {
      return userState.company_name;
    }
    if (userState?.company) {
      if (typeof userState.company === "object" && userState.company.name) {
        return userState.company.name;
      }
      const matched = companyOptions?.find(
        (c) => c.value === userState.company
      );
      if (matched?.label) {
        return matched.label;
      }
    }
    if (userState?.user_profile?.company_name) {
      return userState.user_profile.company_name;
    }
    if (userState?.internal_user && userState?.organisation_detail?.name) {
      return userState.organisation_detail.name;
    }
    return "";
  }, [userState, companyOptions]);

  useEffect(() => {
    if (userState?.id) {
      profileForm.setFieldsValue({
        fullname: userState.fullname || "",
        email: userState.email || "",
        company_name: companyDisplay || "",
      });
    }
  }, [
    userState?.id,
    userState?.fullname,
    userState?.email,
    companyDisplay,
    profileForm,
  ]);

  const avatarInitials = useMemo(() => {
    const fromProfile = getUserInitials({
      fullname: userState?.fullname,
      user_profile: userState?.user_profile,
    });
    if (fromProfile) {
      return fromProfile;
    }
    if (userState?.fullname && userState.fullname.trim()) {
      return userState.fullname.trim().charAt(0).toUpperCase();
    }
    if (userState?.email && userState.email.trim()) {
      return userState.email.trim().charAt(0).toUpperCase();
    }
    return "U";
  }, [userState?.fullname, userState?.user_profile, userState?.email]);

  const roleDisplay = useMemo(() => {
    if (!userState?.role) {
      return "USER";
    }
    return String(userState.role).toUpperCase();
  }, [userState?.role]);

  const onProfileFinish = (values) => {
    setProfileLoading(true);
    setProfileError(null);
    const trimmedFullname = (values.fullname || "").trim();
    const trimmedCompanyName = values.company_name
      ? values.company_name.trim()
      : null;
    const payload = isIdcUser
      ? { fullname: trimmedFullname }
      : { fullname: trimmedFullname, company_name: trimmedCompanyName };

    api
      .put("user/profile", payload)
      .then((res) => {
        const updated = res.data;
        UserState.update((s) => {
          s.fullname = updated.fullname;
          s.company_name = updated.company_name || null;
          s.user_profile = updated.user_profile || null;
        });

        const nextUserState = {
          ...userState,
          fullname: updated.fullname,
          company_name: updated.company_name || null,
          user_profile: updated.user_profile || null,
        };
        if (!isUserProfileIncomplete(nextUserState)) {
          try {
            window.localStorage?.removeItem(
              getProfileAlertStorageKey(userState?.id)
            );
          } catch (e) {
            // ignore localStorage errors
          }
        }
        message.success("Profile updated successfully");
      })
      .catch((err) => {
        const detail =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update profile";
        const errorText =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
            ? detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
            : JSON.stringify(detail);
        setProfileError(errorText);
      })
      .finally(() => {
        setProfileLoading(false);
      });
  };

  const onPasswordValuesChange = (changedValues) => {
    if ("new_password" in changedValues) {
      setPasswordCriteria(
        checkPasswordCriteria(changedValues?.new_password || "")
      );
    }
  };

  const onPasswordFinish = (values) => {
    const { current_password, new_password, confirm_password } = values;
    if (checkPasswordCriteria(new_password || "").length !== 5) {
      setPasswordError("New password must satisfy all 5 criteria.");
      return;
    }
    if (new_password !== confirm_password) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    api
      .post("user/change-password", {
        current_password,
        new_password,
      })
      .then(() => {
        passwordForm.resetFields();
        setPasswordCriteria([]);
        message.success("Password changed successfully");
      })
      .catch((err) => {
        const detail =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to change password";
        const errorText =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
            ? detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
            : JSON.stringify(detail);
        setPasswordError(errorText);
      })
      .finally(() => {
        setPasswordLoading(false);
      });
  };

  return (
    <ContentLayout
      title="My Profile"
      breadcrumbItems={[
        { title: "Home", path: "/", href: "/" },
        {
          title: "My Profile",
          path: routePath.profile,
          href: routePath.profile,
        },
      ]}
      hideIDCSubMenu={!isIdcUser}
      wrapperId="profile"
    >
      <div className="profile-page">
        <div className="profile-alert-wrapper">
          <IncompleteProfileAlert showActionLink={false} />
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8} lg={7}>
            <Card className="profile-identity-card" bordered={false}>
              <Avatar size={72} className="profile-avatar">
                {avatarInitials}
              </Avatar>
              <h3 className="profile-fullname">
                {userState?.fullname || "Toolkit User"}
              </h3>
              <p className="profile-email">{userState?.email || ""}</p>
              <div className="profile-tags-wrapper">
                <Tag color="geekblue">{roleDisplay}</Tag>
                {userTools.includes("idc") && <Tag color="green">IDC</Tag>}
                {userTools.includes("academy") && (
                  <Tag color="blue">Academy</Tag>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={16} lg={17} className="profile-right-column">
            <Card
              title="Profile Details"
              className="profile-card"
              bordered={false}
            >
              <Form
                data-testid="profile-details-form"
                form={profileForm}
                layout="vertical"
                onFinish={onProfileFinish}
              >
                {profileError && (
                  <Alert
                    type="error"
                    showIcon
                    closable
                    message={profileError}
                    onClose={() => setProfileError(null)}
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Form.Item
                  name="fullname"
                  label="Full Name"
                  rules={[
                    { required: true, message: "Please enter your full name" },
                    {
                      whitespace: true,
                      message: "Full name cannot be empty",
                    },
                  ]}
                >
                  <Input
                    data-testid="input-fullname"
                    maxLength={125}
                    placeholder="Full Name"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email Address"
                  extra={
                    <span className="field-note">
                      Email address cannot be changed.
                    </span>
                  }
                >
                  <Input data-testid="input-email" disabled />
                </Form.Item>

                {isIdcUser ? (
                  <Form.Item
                    name="company_name"
                    label="Organization / Company"
                    extra={
                      <span className="field-note">Assigned by IDH Admin</span>
                    }
                  >
                    <Input data-testid="input-company-name" disabled />
                  </Form.Item>
                ) : (
                  <Form.Item name="company_name" label="Organization / Company">
                    <Input
                      data-testid="input-company-name"
                      maxLength={255}
                      placeholder="Organization or Company"
                    />
                  </Form.Item>
                )}

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={profileLoading}
                    data-testid="save-profile-btn"
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            <Card
              title="Security & Password"
              className="profile-card"
              bordered={false}
            >
              <Form
                data-testid="change-password-form"
                form={passwordForm}
                layout="vertical"
                onFinish={onPasswordFinish}
                onValuesChange={onPasswordValuesChange}
              >
                {passwordError && (
                  <Alert
                    type="error"
                    showIcon
                    closable
                    message={passwordError}
                    onClose={() => setPasswordError(null)}
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Form.Item
                  name="current_password"
                  label="Current Password"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your current password",
                    },
                  ]}
                >
                  <Input.Password
                    data-testid="input-current-password"
                    placeholder="Current password"
                  />
                </Form.Item>

                <Form.Item
                  name="new_password"
                  label="New Password"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your new password",
                    },
                    () => ({
                      validator(_, value) {
                        if (
                          !value ||
                          checkPasswordCriteria(value).length === 5
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Please satisfy all password criteria")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    data-testid="input-new-password"
                    placeholder="New password"
                  />
                </Form.Item>

                <div className="password-criteria-container">
                  <PasswordCriteria
                    values={passwordCriteria}
                    className="compact"
                  />
                </div>

                <Form.Item
                  name="confirm_password"
                  label="Confirm New Password"
                  dependencies={["new_password"]}
                  rules={[
                    {
                      required: true,
                      message: "Please confirm your new password",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("new_password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords do not match!")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    data-testid="input-confirm-password"
                    placeholder="Confirm new password"
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={passwordLoading}
                    data-testid="change-password-btn"
                  >
                    Change Password
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </ContentLayout>
  );
};

export default Profile;
