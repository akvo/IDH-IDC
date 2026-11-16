import React, { useState } from "react";
import { Button, Form, Input, message } from "antd";
import academyService from "../services/academy";

// The API only requires a non-empty password; the strength rule lives here
export const MIN_PASSWORD_LENGTH = 12;

// "Sign in and security": change the password with the current one.
// A wrong current password is shown on that field; other client errors are
// toasted, and server/network errors by academyClient.
const SignInSecurityCard = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleFinish = ({ currentPassword, newPassword }) => {
    setSaving(true);
    academyService
      .changePassword({ currentPassword, newPassword })
      .then(({ message: text }) => {
        setSaving(false);
        form.resetFields();
        message.success(text || "Password changed successfully");
      })
      .catch((err) => {
        setSaving(false);
        if (err?.status === 400) {
          form.setFields([{ name: "currentPassword", errors: [err.message] }]);
        } else if (err?.status && err.status < 500) {
          message.error(err.message);
        }
      });
  };

  return (
    <section
      className="academy-settings-card"
      aria-labelledby="academy-security-title"
    >
      <h2 id="academy-security-title" className="academy-settings-title">
        Sign in and security
      </h2>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Current password"
          name="currentPassword"
          rules={[{ required: true, message: "Enter your current password" }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <div className="academy-settings-row">
          <Form.Item
            label="New password"
            name="newPassword"
            extra={`At least ${MIN_PASSWORD_LENGTH} characters`}
            // Checked on blur and submit, not while the first characters
            // are typed
            validateTrigger="onBlur"
            dependencies={["currentPassword"]}
            rules={[
              { required: true, message: "Enter a new password" },
              {
                min: MIN_PASSWORD_LENGTH,
                message: `Use at least ${MIN_PASSWORD_LENGTH} characters`,
              },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  value && value === getFieldValue("currentPassword")
                    ? Promise.reject(
                        new Error(
                          "Use a password different from your current one"
                        )
                      )
                    : Promise.resolve(),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Confirm new password"
            name="confirmPassword"
            // Re-checked as the learner types and when the new one changes
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Confirm your new password" },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || value === getFieldValue("newPassword")
                    ? Promise.resolve()
                    : Promise.reject(new Error("Passwords do not match")),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </div>
        <div className="academy-settings-actions">
          <Button htmlType="submit" loading={saving}>
            Update
          </Button>
        </div>
      </Form>
    </section>
  );
};

export default SignInSecurityCard;
