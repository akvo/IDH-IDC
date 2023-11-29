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
  Checkbox,
} from "antd";
import { allUserRole, nonAdminRole, adminRole } from "../../../store/static";
import upperFirst from "lodash/upperFirst";
import { UserState } from "../../../store";
import { api } from "../../../lib";
import FormItem from "antd/es/form/FormItem";

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

  // const organisationOptions = UIState.useState((s) => s.organisationOptions);

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

          const businessUnits = data?.business_units?.length
            ? data.business_units.map((bu) => bu.business_unit)
            : [];
          if (businessUnits.length) {
            setShowBusinessUnit(true);
          }

          setInitValues({
            ...data,
            business_units: businessUnits,
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

  const onFinish = (values) => {
    setSubmitting(true);
    const { fullname, email, role, business_units } = values;

    const payload = new FormData();
    payload.append("fullname", fullname);
    payload.append("email", email);
    payload.append("role", role);
    // payload.append("organisation", organisation);

    let allCasesValue = adminRole.includes(role) ? true : false;
    if (business_units) {
      allCasesValue = true;
      let businessUnitVals = Array.isArray(business_units)
        ? business_units
        : [business_units];
      businessUnitVals = businessUnitVals.map((bu) => ({
        business_unit: bu,
        role: adminRole.includes(role) ? "admin" : "member",
      }));
      payload.append("business_units", JSON.stringify(businessUnitVals));
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
        messageApi.open({
          type: "error",
          content: "Failed! Something went wrong.",
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleOnChangeRole = (value) => {
    setSelectedRole(value);
  };

  return (
    <ContentLayout
      breadcrumbItems={[
        { title: "Home", href: "/welcome" },
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
            <Col span={12}>
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
                {selectedRole === "user" && (
                  <FormItem>
                    <Checkbox
                      checked={showBusinessUnit}
                      onChange={() => setShowBusinessUnit(!showBusinessUnit)}
                    >
                      IDH Internal User
                    </Checkbox>
                  </FormItem>
                )}
              </Card>
            </Col>
            {/* EOL User Information */}
            {/* Other Inputs */}
            <Col span={12}>
              {/* Business Unit Selector */}
              {useRoleWithBusinessUnitFieldByDefault.includes(selectedRole) ||
              showBusinessUnit ? (
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
