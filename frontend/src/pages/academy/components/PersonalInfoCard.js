import React from "react";
import { Form, Input } from "antd";

const PersonalInfoCard = ({ isEditing = false }) => {
  return (
    <div className="academy-account-card" data-testid="personal-info-card">
      <div className="academy-account-card__header">
        <h2 className="academy-account-card__title">Personal information</h2>
        <p className="academy-account-card__subtitle">
          Update personal details.
        </p>
      </div>
      <div className="academy-account-card__grid">
        <Form.Item
          name="first_name"
          label="First name"
          rules={[
            { required: true, message: "First name is required" },
            { whitespace: true, message: "First name is required" },
            { max: 125, message: "Max 125 characters" },
          ]}
        >
          <Input
            maxLength={125}
            disabled={!isEditing}
            placeholder="Fill in your First name"
            data-testid="input-first-name"
          />
        </Form.Item>
        <Form.Item
          name="last_name"
          label="Last name"
          rules={[{ max: 125, message: "Max 125 characters" }]}
        >
          <Input
            maxLength={125}
            disabled={!isEditing}
            placeholder="Fill in your Last name"
            data-testid="input-last-name"
          />
        </Form.Item>
      </div>
      <div className="academy-account-card__full-width">
        <Form.Item
          name="email"
          label="Email"
          extra="Email address cannot be changed."
        >
          <Input disabled data-testid="input-email" />
        </Form.Item>
      </div>
    </div>
  );
};

export default PersonalInfoCard;
