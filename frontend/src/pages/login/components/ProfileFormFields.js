import React, { useMemo } from "react";
import { AutoComplete, Checkbox, Form, Input, Select } from "antd";
import {
  checkPasswordCriteria,
  passwordCheckBoxOptions,
} from "../../../components/utils";
import {
  PRESET_COMPANY_TYPES,
  PRESET_SECTORS,
  PRESET_REGIONS,
  commodityNameOptions,
} from "../../../store/static";

const toOptions = (items) =>
  items.map((item) => ({ label: item, value: item }));
const companyTypeOptions = toOptions(PRESET_COMPANY_TYPES);
const sectorOptions = toOptions(PRESET_SECTORS);
const regionOptions = toOptions(PRESET_REGIONS);

const required = (message) => ({ required: true, whitespace: true, message });

const passwordRule = {
  validator: (_, value) =>
    !value ||
    checkPasswordCriteria(value).length === passwordCheckBoxOptions.length
      ? Promise.resolve()
      : Promise.reject(new Error("The password doesn’t meet the rules")),
};

// Plain-language names for the password criteria, in checklist order
const PASSWORD_RULE_HINTS = {
  "Min 8 Character": "at least 8 characters",
  "Uppercase Character": "an uppercase letter",
  "Lowercase Character": "a lowercase letter",
  Numbers: "a number",
  "Special Character": "a symbol",
};

// Live hint under the password: what is still missing as the user types
export const getPasswordHint = (password) => {
  if (!password) {
    return "At least 8 characters, with an uppercase and a lowercase letter, a number and a symbol.";
  }
  const met = checkPasswordCriteria(password);
  const missing = passwordCheckBoxOptions
    .filter(({ name }) => !met.includes(name))
    .map(({ name }) => PASSWORD_RULE_HINTS[name]);
  return missing.length
    ? `Still needed: ${missing.join(", ")}.`
    : "Meets all the password rules.";
};

const termsRule = {
  validator: (_, checked) =>
    checked
      ? Promise.resolve()
      : Promise.reject(
          new Error("Please agree to the Data Security Provision")
        ),
};

const matchesSearch = (input, option) =>
  option.value.toLowerCase().includes(input.trim().toLowerCase());

// Data Security Provision consent, shown just above the submit button
export const TermsField = ({ onOpenTerms }) => (
  <Form.Item
    name="terms"
    valuePropName="checked"
    rules={[termsRule]}
    className="terms-form-item"
  >
    <Checkbox data-testid="checkbox-data-security">
      I agree to the{" "}
      <button
        type="button"
        className="link-security-provision"
        onClick={(e) => {
          // Opening the provision must not toggle the checkbox
          e.preventDefault();
          onOpenTerms();
        }}
      >
        Data Security Provision
      </button>
      .
    </Checkbox>
  </Form.Item>
);

export const EmailField = ({ disabled = false }) => (
  <Form.Item
    label="Email*"
    name="email"
    rules={[
      required("Please enter your email"),
      { type: "email", message: "Please enter a valid email address" },
    ]}
  >
    <Input
      size="large"
      type="email"
      placeholder="olivia@idh.com"
      autoComplete="email"
      disabled={disabled}
      data-testid="input-email"
    />
  </Form.Item>
);

export const PasswordField = () => {
  const form = Form.useFormInstance();
  const password = Form.useWatch("password", form);
  return (
    <Form.Item
      label="Password*"
      name="password"
      extra={
        <span aria-live="polite" data-testid="password-hint">
          {getPasswordHint(password)}
        </span>
      }
      rules={[required("Please enter a password"), passwordRule]}
    >
      <Input.Password
        size="large"
        placeholder="Create a password"
        autoComplete="new-password"
        data-testid="input-password"
      />
    </Form.Item>
  );
};

// Free text, with existing companies offered as suggestions
export const CompanyNameField = ({ label = "Company name*", companyNames }) => {
  const companyOptions = useMemo(() => toOptions(companyNames), [companyNames]);
  return (
    <Form.Item
      label={label}
      name="company_name"
      rules={[
        required("Please enter your organisation"),
        { max: 255, message: "Use at most 255 characters" },
      ]}
    >
      <AutoComplete options={companyOptions} filterOption={matchesSearch}>
        <Input
          size="large"
          placeholder="Unicef"
          autoComplete="organization"
          data-testid="input-company-name"
        />
      </AutoComplete>
    </Form.Item>
  );
};

export const SectorField = () => (
  <Form.Item
    label="Sector*"
    name="sector"
    rules={[{ required: true, message: "Please select a sector" }]}
  >
    <Select
      size="large"
      showSearch
      placeholder="Agriculture"
      options={sectorOptions}
      data-testid="select-sector"
    />
  </Form.Item>
);

export const RegionField = () => (
  <Form.Item
    label="Region*"
    name="region_name"
    rules={[{ required: true, message: "Please select a region" }]}
  >
    <Select
      size="large"
      showSearch
      placeholder="West Africa"
      options={regionOptions}
      data-testid="select-region"
    />
  </Form.Item>
);

export const CommoditiesField = () => (
  <Form.Item
    label="Commodities*"
    name="commodities"
    rules={[
      {
        required: true,
        type: "array",
        min: 1,
        message: "Please select at least one commodity",
      },
    ]}
  >
    <Select
      size="large"
      mode="multiple"
      allowClear
      placeholder="Cotton"
      options={commodityNameOptions}
      data-testid="select-commodities"
    />
  </Form.Item>
);

// Account and profile fields of the Academy sign-up form. The fields are
// exported one by one so the IDC invitation form can arrange its own
// subset. Must render inside an antd Form.
const ProfileFormFields = ({ companyNames = [] }) => (
  <>
    <div className="profile-form-grid">
      <Form.Item
        label="First name*"
        name="first_name"
        rules={[required("Please enter your first name")]}
      >
        <Input
          size="large"
          maxLength={125}
          placeholder="Olivia"
          autoComplete="given-name"
          data-testid="input-first-name"
        />
      </Form.Item>
      <Form.Item
        label="Last name*"
        name="last_name"
        rules={[required("Please enter your last name")]}
      >
        <Input
          size="large"
          maxLength={125}
          placeholder="Rhye"
          autoComplete="family-name"
          data-testid="input-last-name"
        />
      </Form.Item>

      <EmailField />
      <PasswordField />
    </div>

    <div className="profile-form-grid">
      <CompanyNameField companyNames={companyNames} />
      <Form.Item
        label="Company type*"
        name="company_type"
        rules={[{ required: true, message: "Please select a company type" }]}
      >
        <Select
          size="large"
          showSearch
          placeholder="NGO"
          options={companyTypeOptions}
          data-testid="select-company-type"
        />
      </Form.Item>

      <SectorField />
      <RegionField />
    </div>

    <CommoditiesField />
  </>
);

export default ProfileFormFields;
