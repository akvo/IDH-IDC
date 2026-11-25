import React, { useMemo } from "react";
import { Form, Input, Select } from "antd";
import CommodityTagSelector from "./CommodityTagSelector";
import {
  PRESET_COMPANY_TYPES,
  PRESET_SECTORS,
  PRESET_REGIONS,
  getOptionsWithFallback,
} from "../../../store/static";

export const ROLE_TOOLTIP =
  "Role and user type are set by IDH. Contact support to request permissions changes.";
export const IDH_COMPANY_TOOLTIP =
  "Set by IDH. Contact idc-support@idhtrade.org to change it.";

// "super_admin" -> "Super Admin"
export const formatRole = (role) =>
  role
    ? String(role)
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

const AdditionalInfoCard = ({
  isEditing = false,
  companyPlaceholder = "Fill in your company or organisation",
  currentValues = {},
  role = "",
  idhCompanyName = "",
  companyRequired = true,
}) => {
  const companyTypeOptions = useMemo(
    () =>
      getOptionsWithFallback(PRESET_COMPANY_TYPES, currentValues?.company_type),
    [currentValues?.company_type]
  );

  const sectorOptions = useMemo(
    () => getOptionsWithFallback(PRESET_SECTORS, currentValues?.sector),
    [currentValues?.sector]
  );

  const regionOptions = useMemo(
    () => getOptionsWithFallback(PRESET_REGIONS, currentValues?.region_name),
    [currentValues?.region_name]
  );

  return (
    <div className="academy-account-card" data-testid="additional-info-card">
      <div className="academy-account-card__header">
        <h2 className="academy-account-card__title">Additional information</h2>
        <p className="academy-account-card__subtitle">
          Update your personal details.
        </p>
      </div>

      <div className="academy-account-card__grid academy-account-card__grid--3">
        <Form.Item
          name="company_name"
          label="Company/Organisation name"
          rules={[
            {
              required: companyRequired,
              whitespace: true,
              message: "Company/Organisation name is required",
            },
            { max: 255, message: "Max 255 characters" },
          ]}
        >
          <Input
            maxLength={255}
            disabled={!isEditing}
            placeholder={companyPlaceholder}
            data-testid="input-company-name"
          />
        </Form.Item>
        <Form.Item label="Role" tooltip={ROLE_TOOLTIP}>
          <Input disabled value={formatRole(role)} data-testid="input-role" />
        </Form.Item>
        <Form.Item
          name="sector"
          label="Sector"
          rules={[{ required: true, message: "Sector is required" }]}
        >
          <Select
            allowClear
            showSearch
            disabled={!isEditing}
            placeholder="Select sector"
            data-testid="select-sector"
            options={sectorOptions}
          />
        </Form.Item>

        <Form.Item
          name="region_name"
          label="Region"
          rules={[{ required: true, message: "Region is required" }]}
        >
          <Select
            allowClear
            showSearch
            disabled={!isEditing}
            placeholder="Select region"
            data-testid="select-region"
            options={regionOptions}
          />
        </Form.Item>
        <Form.Item
          name="commodities"
          label="Commodities"
          rules={[
            {
              required: true,
              type: "array",
              min: 1,
              message: "Select at least one commodity",
            },
          ]}
        >
          <CommodityTagSelector disabled={!isEditing} />
        </Form.Item>
        <Form.Item name="company_type" label="Company type">
          <Select
            allowClear
            showSearch
            disabled={!isEditing}
            placeholder="Select company type"
            data-testid="select-company-type"
            options={companyTypeOptions}
          />
        </Form.Item>

        {idhCompanyName && (
          <Form.Item label="IDH Company" tooltip={IDH_COMPANY_TOOLTIP}>
            <Input
              disabled
              value={idhCompanyName}
              data-testid="input-idh-company"
            />
          </Form.Item>
        )}
      </div>
    </div>
  );
};

export default AdditionalInfoCard;
