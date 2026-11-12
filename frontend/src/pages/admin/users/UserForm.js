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
  Space,
  Divider,
} from "antd";
import { allUserRole, nonAdminRole, adminRole } from "../../../store/static";
import upperFirst from "lodash/upperFirst";
import { UserState, UIState } from "../../../store";
import { api } from "../../../lib";
import { CustomEvent } from "@piwikpro/react-piwik-pro";
import { routePath } from "../../../components/route";

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

  // const organisationOptions = UIState.useState((s) => s.organisationOptions);
  const companyOptions = UIState.useState((s) => s.companyOptions);

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

  const onFinish = async (values) => {
    setSubmitting(true);
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
        const { data, status } = e.response;
        if (status === 409 && data?.detail) {
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
          <Row gutter={[16, 16]}>
            {/* User Information */}
            <Col xs={24} lg={12}>
              <Card title="User Information">
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
                    <span className="current-tools-label">Current Access:</span>{" "}
                    {userTools.includes("academy") ||
                    userTools.includes("idc") ? (
                      <Space size={4} wrap>
                        {userTools.includes("academy") && (
                          <Tag color="blue">Academy</Tag>
                        )}
                        {userTools.includes("idc") && (
                          <Tag color="green">IDC</Tag>
                        )}
                      </Space>
                    ) : (
                      "-"
                    )}
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
              {showCompany || grantIdc ? (
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
              style={{ width: "200px", float: "left" }}
              loading={submitting}
            >
              {isUserActive !== null && !isUserActive
                ? "Approve User"
                : "Save User"}
            </Button>
          </Form.Item>
        </Form>
      )}
    </ContentLayout>
  );
};

export default UserForm;
