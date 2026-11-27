import React, { useState, useEffect } from "react";
import "./user.scss";
import { useNavigate, useParams } from "react-router-dom";
import { ContentLayout } from "../../../components/layout";
import {
  Form,
  Input,
  Card,
  Row,
  Col,
  Button,
  Select,
  Spin,
  message,
  Switch,
  Tag,
  Divider,
  Popconfirm,
  Modal,
  List,
  Alert,
} from "antd";
import {
  allUserRole,
  nonAdminRole,
  adminRole,
  LINK_TO_CASE_PROD,
} from "../../../store/static";
import upperFirst from "lodash/upperFirst";
import { UserState, UIState } from "../../../store";
import { api } from "../../../lib";
import { CustomEvent } from "@piwikpro/react-piwik-pro";
import { routePath } from "../../../components/route";
import ToolTags from "../../../components/common/ToolTags";

const transformToSelectOptions = (values) => {
  return values.map((x) => ({
    value: x,
    label: x
      .split("_")
      .map((y) => upperFirst(y))
      .join(" "),
  }));
};

const defFormListValue = {
  cases: [{ case: null, permission: null }],
};

const useRoleWithBusinessUnitFieldByDefault = ["admin"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACADEMY_CHECK_DEBOUNCE_MS = 300;

const getErrorDetail = (e, fallback) => {
  const detail = e?.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail[0]?.msg) {
    return detail[0].msg;
  }
  return fallback;
};

const userRoleTypeOptions = [
  { label: "IDH Internal User", value: "internal" },
  { label: "External Regular", value: "external_regular" },
  { label: "External Advanced", value: "external_advanced" },
];

const UserForm = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [form] = Form.useForm();
  const userRole = UserState.useState((s) => s.role);
  const [submitting, setSubmitting] = useState(false);
  const [initValues, setInitValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [isUserActive, setIsUserActive] = useState(null);
  const [showBusinessUnit, setShowBusinessUnit] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [userTools, setUserTools] = useState([]);
  const [grantIdc, setGrantIdc] = useState(false);
  const [baseUserSnapshot, setBaseUserSnapshot] = useState(null);

  const [revokingIdc, setRevokingIdc] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [conflictUser, setConflictUser] = useState(null);
  const [conflictCompanyId, setConflictCompanyId] = useState(null);
  const [grantingConflict, setGrantingConflict] = useState(false);
  // Add user: the typed email belongs to an Academy user without IDC access
  const [academyMatch, setAcademyMatch] = useState(null);
  const watchedEmail = Form.useWatch("email", form);

  const currentUserId = UserState.useState((s) => s.id);

  // const organisationOptions = UIState.useState((s) => s.organisationOptions);
  const companyOptions = UIState.useState((s) => s.companyOptions);
  const companyList = companyOptions;

  const businessUnitOptions = window.master.business_units?.map((x) => ({
    label: x.name,
    value: x.id,
  }));
  const roleOptions = transformToSelectOptions(
    userRole === "super_admin" ? allUserRole : nonAdminRole
  );

  useEffect(() => {
    setLoading(true);
    if (userId) {
      api
        .get(`user/${userId}`)
        .then((res) => {
          const { data } = res;
          setSelectedRole(data?.role || null);
          setIsUserActive(data.active);
          const tools = Array.isArray(data?.tools) ? data.tools : [];
          setUserTools(tools);
          setBaseUserSnapshot({
            fullname: data?.fullname || "",
            email: data?.email || "",
            role: data?.role || "",
          });
          let userType = null;

          const businessUnits = data?.business_units?.length
            ? data.business_units.map((bu) => bu.business_unit)
            : [];
          if (businessUnits.length) {
            userType = "internal";
            setShowBusinessUnit(true);
          }

          if (data?.company) {
            userType = data.user_type || "external_regular";
            setShowCompany(true);
          }

          if (
            data?.role === "user" &&
            !businessUnits.length &&
            !data?.company
          ) {
            userType = data?.user_type || "external_regular";
          }

          setInitValues({
            ...data,
            user_type: userType,
            business_units: businessUnits,
            idc_user_type: "external_regular",
          });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setTimeout(() => {
            setLoading(false);
          }, 500);
        });
    } else {
      setInitValues(defFormListValue);
      setLoading(false);
    }
  }, [userId, form]);

  useEffect(() => {
    // Clear at once so a stale match never applies to a new email
    setAcademyMatch(null);
    const email = (watchedEmail || "").trim();
    let active = true;
    const timer =
      !userId && EMAIL_PATTERN.test(email)
        ? setTimeout(() => {
            api
              .get(
                `user/check-academy-email?email=${encodeURIComponent(email)}`
              )
              .then(({ data }) => {
                if (active && data?.is_academy_user && !data?.has_idc_access) {
                  setAcademyMatch(data);
                  if (!form.getFieldValue("fullname") && data.fullname) {
                    form.setFieldValue("fullname", data.fullname);
                  }
                }
              })
              // Without a match the form keeps the invitation flow
              .catch(() => {});
          }, ACADEMY_CHECK_DEBOUNCE_MS)
        : null;
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [watchedEmail, userId, form]);

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const handleToggleGrantIdc = (checked) => {
    setGrantIdc(checked);
    if (checked) {
      if (!form.getFieldValue("idc_user_type")) {
        form.setFieldsValue({ idc_user_type: "external_regular" });
      }
    }
  };

  const handleRevokeIdc = async () => {
    setRevokingIdc(true);
    try {
      await api.post(`user/${userId}/revoke-idc`);
      setUserTools((prev) => prev.filter((t) => t !== "idc"));
      setShowCompany(false);
      setGrantIdc(false);
      form.setFieldsValue({
        company: null,
      });
      messageApi.open({
        type: "success",
        content: "IDC access revoked successfully.",
      });
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) {
        const cases = e.response.data?.detail?.cases || [];
        Modal.confirm({
          title: "Cannot Revoke IDC Access",
          icon: null,
          content: (
            <div>
              <p>
                This user cannot be revoked from IDC because they are the owner
                of the following cases:
              </p>
              <List
                header={null}
                footer={null}
                size="small"
                bordered
                style={{ maxHeight: "200px", overflow: "auto" }}
                dataSource={cases}
                renderItem={(item) => <List.Item>{item.label}</List.Item>}
              />
              <p style={{ marginTop: 12 }}>
                Please assign new owners for these cases before revoking IDC
                access.
              </p>
            </div>
          ),
          okText: "Go to cases",
          onOk: () => {
            const userEmail = form.getFieldValue("email") || "";
            const URL = `${LINK_TO_CASE_PROD}?owner=${userEmail}`;
            window.open(URL, "_blank");
          },
          cancelText: "Cancel",
        });
      } else {
        const detail = e?.response?.data?.detail;
        let content = "Failed to revoke IDC access!";
        if (typeof detail === "string") {
          content = detail;
        }
        messageApi.open({
          type: "error",
          content,
        });
      }
    } finally {
      setRevokingIdc(false);
    }
  };

  const handleDeactivateUser = async () => {
    setActionLoading(true);
    try {
      await api.post(`user/${userId}/deactivate`);
      setIsUserActive(false);
      messageApi.open({
        type: "success",
        content: "User deactivated successfully.",
      });
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      let content = "Failed to deactivate user.";
      if (typeof detail === "string") {
        content = detail;
      }
      messageApi.open({
        type: "error",
        content,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateUser = async () => {
    setActionLoading(true);
    try {
      await api.post(`user/${userId}/activate`);
      setIsUserActive(true);
      messageApi.open({
        type: "success",
        content: "User reactivated successfully.",
      });
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      let content = "Failed to reactivate user.";
      if (typeof detail === "string") {
        content = detail;
      }
      messageApi.open({
        type: "error",
        content,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelConflict = () => {
    setConflictUser(null);
    setConflictCompanyId(null);
  };

  const handleGrantConflict = async () => {
    if (!conflictCompanyId) {
      messageApi.open({
        type: "error",
        content: "Please select an IDC Company.",
      });
      return;
    }
    setGrantingConflict(true);
    try {
      await api.post(`user/${conflictUser.user_id}/grant-idc`, {
        company_id: conflictCompanyId,
        user_type: conflictUser.user_type,
      });
      messageApi.open({
        type: "success",
        content: "IDC access granted and company linked successfully.",
      });
      setConflictUser(null);
      setConflictCompanyId(null);
      form.resetFields();
      setTimeout(() => {
        navigate("/admin/users");
      }, 500);
    } catch (e) {
      console.error(e);
      let content = "Failed to grant IDC access.";
      const detail = e?.response?.data?.detail;
      if (typeof detail === "string") {
        content = detail;
      }
      messageApi.open({
        type: "error",
        content,
      });
    } finally {
      setGrantingConflict(false);
    }
  };

  const grantAcademyUserIdc = async (values) => {
    const { role, company, user_type, business_units } = values;
    const businessUnits = [].concat(business_units || []).map((bu) => ({
      business_unit: bu,
      role: adminRole.includes(role) ? "admin" : "member",
    }));
    try {
      await api.post(`user/grant-idc-access?user_id=${academyMatch.user_id}`, {
        company_id: company,
        role,
        user_type: user_type || "external_regular",
        business_units: businessUnits,
      });
      messageApi.open({
        type: "success",
        content: "IDC access granted successfully",
      });
      setTimeout(() => {
        form.resetFields();
        navigate("/admin/users");
      }, 500);
    } catch (e) {
      messageApi.open({
        type: "error",
        content: getErrorDetail(e, "Failed to grant IDC access."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    if (!userId && academyMatch) {
      await grantAcademyUserIdc(values);
      return;
    }
    const {
      fullname,
      email,
      role,
      business_units,
      company,
      user_type,
      idc_user_type,
    } = values;

    if (userId && grantIdc) {
      try {
        const idcUserType = idc_user_type || "external_regular";
        const baseChanged =
          !baseUserSnapshot ||
          baseUserSnapshot.fullname !== fullname ||
          baseUserSnapshot.role !== role ||
          baseUserSnapshot.email !== email;

        let approvedParam = "";
        if (isUserActive !== null && !isUserActive) {
          approvedParam = "?approved=true";
        }

        if (baseChanged || (isUserActive !== null && !isUserActive)) {
          const basePayload = new FormData();
          basePayload.append("fullname", fullname);
          basePayload.append("email", email);
          basePayload.append("role", role);
          basePayload.append("user_type", idcUserType);
          basePayload.append("is_active", true);
          basePayload.append("all_cases", adminRole.includes(role));
          await api.put(`user/${userId}${approvedParam}`, basePayload);
        }

        await api.post(`user/${userId}/grant-idc`, {
          company_id: company,
          user_type: idcUserType,
        });

        messageApi.open({
          type: "success",
          content: "User saved and IDC access granted.",
        });
        setTimeout(() => {
          form.resetFields();
          navigate("/admin/users");
        }, 500);
      } catch (e) {
        console.error(e);
        let content = "Failed! Something went wrong.";
        const detail = e?.response?.data?.detail;
        if (typeof detail === "string") {
          content = detail;
        } else if (
          Array.isArray(detail) &&
          detail.length > 0 &&
          detail[0]?.msg
        ) {
          content = detail[0].msg;
        }
        messageApi.open({
          type: "error",
          content: content,
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const payload = new FormData();
    payload.append("fullname", fullname);
    payload.append("email", email);
    payload.append("role", role);
    const resolvedUserType = user_type || initValues.user_type;
    if (resolvedUserType) {
      payload.append("user_type", resolvedUserType);
    }
    // payload.append("organisation", organisation);

    let allCasesValue = adminRole.includes(role) ? true : false;
    if (business_units) {
      // internal user
      allCasesValue = true;
      let businessUnitVals = Array.isArray(business_units)
        ? business_units
        : [business_units];
      businessUnitVals = businessUnitVals.map((bu) => ({
        business_unit: bu,
        role: adminRole.includes(role) ? "admin" : "member",
      }));
      payload.append("business_units", JSON.stringify(businessUnitVals));
    } else {
      if (company) {
        payload.append("company", company);
      }
      // external user
      CustomEvent.trackEvent(
        "User Management",
        "Invite External User",
        "New external users",
        1,
        { dimension2: "External" }
      );

      // Matomo Cloudron
      if (window._paq) {
        if (window._paq) {
          window._paq.push([
            "trackEvent",
            "User Management", // Category / Feature
            "Invite User - External", // Action (aggregatable)
            "", // Label (unused)
            1,
          ]);
        }

        // future-proofing
        window._paq.push([
          "trackEvent",
          "User Management",
          "Invite User",
          "user_type=external",
          1,
        ]);
      }
    }
    payload.append("all_cases", allCasesValue);

    if (userId) {
      payload.append("is_active", true);
    }

    let approvedParam = "";
    if (isUserActive !== null && !isUserActive) {
      approvedParam = "?approved=true";
    }

    const apiCall = userId
      ? api.put(`user/${userId}${approvedParam}`, payload)
      : api.post("/user/register?invitation_id=true", payload);
    apiCall
      .then(() => {
        messageApi.open({
          type: "success",
          content: "User saved successfully.",
        });
        setTimeout(() => {
          form.resetFields();
          navigate("/admin/users");
        }, 500);
      })
      .catch((e) => {
        console.error(e);
        let content = "Failed! Something went wrong.";
        const { data, status } = e?.response || {};
        if (status === 409 && data?.detail?.is_academy_user === true) {
          const detail = data.detail;
          const conflictUserType =
            resolvedUserType === "internal"
              ? "external_regular"
              : resolvedUserType || "external_regular";
          setConflictUser({
            user_id: detail.user_id || detail.id,
            fullname: detail.fullname,
            email: detail.email,
            academy_company: detail.academy_company,
            user_type: conflictUserType,
            has_form_company: Boolean(company),
          });
          setConflictCompanyId(company || null);
          return;
        }
        if (status === 409 && typeof data?.detail === "string") {
          content = data.detail;
        } else if (typeof data?.detail === "string") {
          content = data.detail;
        }
        messageApi.open({
          type: "error",
          content: content,
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleOnChangeRole = (value) => {
    setSelectedRole(value);
  };

  const handleOnChangeUserType = (value) => {
    if (value === "internal") {
      setShowCompany(false);
      setShowBusinessUnit(true);
    } else if (value === "external_regular" || value === "external_advanced") {
      // external
      setShowBusinessUnit(false);
      setShowCompany(true);
    }
  };

  let submitLabel = "Save User";
  if (!userId) {
    submitLabel = academyMatch ? "Give IDC access" : "Send invitation";
  } else if (isUserActive !== null && !isUserActive) {
    submitLabel = "Approve User";
  }

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: routePath.idc.dashboard },
        { title: "Users", href: "/admin/users" },
        {
          title: `${userId ? "Edit" : "Add"} User`,
          href: `/admin/user/${userId ? userId : "new"}`,
        },
      ]}
      title={`${userId ? "Edit" : "Add"} User`}
      wrapperId="user"
    >
      {contextHolder}
      {loading ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        <Form
          form={form}
          name="user-form"
          layout="vertical"
          initialValues={initValues}
          onFinish={onFinish}
          className="user-form-container"
        >
          {academyMatch && (
            <Alert
              type="info"
              showIcon
              className="academy-user-alert"
              data-testid="academy-user-alert"
              message="This person already has an Academy account. Giving IDC access adds the calculator to their account; they keep their current login."
            />
          )}
          <Row gutter={[16, 16]}>
            {/* User Information */}
            <Col xs={24} lg={12}>
              <Card
                title="User Information"
                extra={
                  userId && isUserActive !== null ? (
                    <Tag color={isUserActive ? "green" : "default"}>
                      {isUserActive ? "Active" : "Inactive"}
                    </Tag>
                  ) : null
                }
              >
                <Form.Item
                  label="Fullname"
                  name="fullname"
                  rules={[
                    {
                      required: true,
                      message: "Fullname is required",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
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
                      message: "Email is required",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Role"
                  name="role"
                  rules={[
                    {
                      required: true,
                      message: "Role is required",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    filterOption={filterOption}
                    options={roleOptions}
                    onChange={handleOnChangeRole}
                  />
                </Form.Item>
                {/* Hide organisation for now */}
                {/* <Form.Item
                  label="Organisation"
                  name="organisation"
                  rules={[
                    {
                      required: true,
                      message: "Organisation is required",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    filterOption={filterOption}
                    options={organisationOptions}
                  />
                </Form.Item> */}
                {selectedRole === "user" &&
                  (!userId || userTools.includes("idc")) && (
                    <Form.Item
                      label="User Type"
                      name="user_type"
                      rules={[
                        {
                          required: true,
                          message: "User type is required",
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="children"
                        filterOption={filterOption}
                        options={userRoleTypeOptions}
                        onChange={handleOnChangeUserType}
                      />
                    </Form.Item>
                  )}
              </Card>
            </Col>
            {/* EOL User Information */}
            {/* Other Inputs */}
            <Col xs={24} lg={12}>
              {userId && (
                <Card
                  title="Tool Access"
                  className={`tool-access-card${
                    grantIdc ? " is-granting" : ""
                  }`}
                  data-testid="tool-access-card"
                >
                  <div className="current-tools-section">
                    <span className="current-tools-label">Current Access:</span>
                    <ToolTags tools={userTools} emptyText="-" />
                    {userTools.includes("idc") ? (
                      <p className="tool-access-desc">
                        This user already has access to the Income Driver
                        Calculator (IDC).
                      </p>
                    ) : (
                      <p className="tool-access-desc">
                        This user does not currently have access to the Income
                        Driver Calculator (IDC).
                      </p>
                    )}
                  </div>
                  {userTools.includes("idc") && (
                    <div className="revoke-idc-row">
                      <span className="revoke-idc-label">
                        Remove IDC Access
                      </span>
                      <Popconfirm
                        title="Remove IDC Access"
                        description="Are you sure you want to remove IDC access for this user? Their company linkage will be removed."
                        okText="Yes"
                        cancelText="No"
                        placement="leftBottom"
                        onConfirm={handleRevokeIdc}
                        disabled={revokingIdc}
                      >
                        <Button
                          danger
                          type="primary"
                          loading={revokingIdc}
                          data-testid="revoke-idc-btn"
                        >
                          Remove IDC Access
                        </Button>
                      </Popconfirm>
                    </div>
                  )}
                  {!userTools.includes("idc") && (
                    <>
                      <div className="grant-idc-row">
                        <span className="grant-idc-label">
                          Grant IDC Access
                        </span>
                        <Switch
                          checked={grantIdc}
                          onChange={handleToggleGrantIdc}
                          data-testid="grant-idc-switch"
                          aria-label="Grant IDC Access"
                        />
                      </div>
                      {grantIdc && (
                        <div className="idc-linkage-panel">
                          <Divider style={{ margin: "16px 0" }} />
                          <Form.Item
                            label="IDC User Type"
                            name="idc_user_type"
                            rules={[
                              {
                                required: true,
                                message: "IDC User Type is required",
                              },
                            ]}
                          >
                            <Select
                              options={[
                                {
                                  label: "External Regular",
                                  value: "external_regular",
                                },
                                {
                                  label: "External Advanced",
                                  value: "external_advanced",
                                },
                              ]}
                            />
                          </Form.Item>
                        </div>
                      )}
                    </>
                  )}
                  {userId && isUserActive !== null && (
                    <div className="account-status-action-row">
                      <span className="account-status-label">
                        Account Status
                      </span>
                      {isUserActive ? (
                        <Popconfirm
                          title="Deactivate Account"
                          description={`Are you sure you want to deactivate ${
                            form.getFieldValue("email") || "this user"
                          }? The user will be unable to log in.`}
                          okText="Yes"
                          cancelText="No"
                          placement="leftBottom"
                          onConfirm={handleDeactivateUser}
                          disabled={
                            actionLoading ||
                            (currentUserId && currentUserId === Number(userId))
                          }
                        >
                          <Button
                            danger
                            type="primary"
                            loading={actionLoading}
                            disabled={
                              actionLoading ||
                              (currentUserId &&
                                currentUserId === Number(userId))
                            }
                            data-testid="deactivate-account-btn"
                          >
                            Deactivate Account
                          </Button>
                        </Popconfirm>
                      ) : (
                        <Popconfirm
                          title="Reactivate Account"
                          description={`Are you sure you want to reactivate ${
                            form.getFieldValue("email") || "this user"
                          }?`}
                          okText="Yes"
                          cancelText="No"
                          placement="leftBottom"
                          onConfirm={handleActivateUser}
                          disabled={actionLoading}
                        >
                          <Button
                            type="primary"
                            className="button-reactivate"
                            loading={actionLoading}
                            disabled={actionLoading}
                            data-testid="reactivate-account-btn"
                          >
                            Reactivate Account
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                  )}
                </Card>
              )}
              {/* Business Unit Selector */}
              {!grantIdc &&
              (useRoleWithBusinessUnitFieldByDefault.includes(selectedRole) ||
                showBusinessUnit) ? (
                <Card title="Business Units">
                  <Form.Item
                    label="Business Units"
                    name="business_units"
                    rules={[
                      {
                        required: true,
                        message: "Business unit is required",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="children"
                      filterOption={filterOption}
                      options={businessUnitOptions}
                    />
                  </Form.Item>
                </Card>
              ) : (
                ""
              )}
              {/* Company Selector */}
              {showCompany || grantIdc || academyMatch ? (
                <Card title="Company">
                  <Form.Item
                    label="Company"
                    name="company"
                    rules={[
                      {
                        required: true,
                        message: "Company is required",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="children"
                      filterOption={filterOption}
                      options={companyOptions}
                    />
                  </Form.Item>
                  {academyMatch?.academy_company && (
                    <p
                      className="self-reported-org"
                      data-testid="self-reported-org"
                    >
                      Self-reported organisation:{" "}
                      <strong>{academyMatch.academy_company}</strong>
                    </p>
                  )}
                </Card>
              ) : (
                ""
              )}
            </Col>
            {/* EOL Other Inputs */}
          </Row>

          <Form.Item>
            <Button
              className="button button-submit button-secondary"
              htmlType="submit"
              loading={submitting}
            >
              {submitLabel}
            </Button>
          </Form.Item>
        </Form>
      )}
      <Modal
        title="Account Already Exists on Academy"
        open={Boolean(conflictUser)}
        destroyOnClose
        onCancel={handleCancelConflict}
        footer={[
          <Button
            key="cancel"
            onClick={handleCancelConflict}
            data-testid="conflict-cancel-btn"
          >
            Cancel
          </Button>,
          <Button
            key="grant"
            type="primary"
            loading={grantingConflict}
            onClick={handleGrantConflict}
            data-testid="conflict-grant-btn"
          >
            Yes, Grant IDC Access
          </Button>,
        ]}
      >
        {conflictUser && (
          <div className="conflict-user-modal-content">
            <p>
              {`A user with email "${conflictUser.email}" (${
                conflictUser.fullname
              }) is currently registered on the Living Income Academy${
                conflictUser.academy_company
                  ? ` under "${conflictUser.academy_company}"`
                  : ""
              }.`}
            </p>
            {conflictUser.has_form_company ? (
              <p>
                Would you like to grant them access to the Income Driver
                Calculator and link them to{" "}
                <strong>
                  {companyList.find((c) => c.value === conflictCompanyId)
                    ?.label || "the selected IDC Company"}
                </strong>
                ?
              </p>
            ) : (
              <>
                <p>
                  Would you like to grant them access to the Income Driver
                  Calculator and link them to an official IDC Company?
                </p>
                <div style={{ marginTop: 16 }}>
                  <Select
                    showSearch
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Select an IDC Company"
                    data-testid="conflict-company-select"
                    filterOption={filterOption}
                    options={companyList}
                    value={conflictCompanyId}
                    onChange={setConflictCompanyId}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </ContentLayout>
  );
};

export default UserForm;
