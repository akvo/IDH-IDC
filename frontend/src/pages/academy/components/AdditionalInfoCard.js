import React, { useMemo } from "react";
import { Form, Input, Select } from "antd";
import CommodityTagSelector from "./CommodityTagSelector";
import {
  PRESET_COMPANY_TYPES,
  PRESET_SECTORS,
  PRESET_REGIONS,
  getOptionsWithFallback,
} from "../../../store/static";

const AdditionalInfoCard = ({
  isEditing = false,
  companyPlaceholder = "Company name",
  currentValues = {},
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
        <h3 className="academy-account-card__title">Additional info</h3>
        <p className="academy-account-card__subtitle">
          Update your photo and personal details.
        </p>
      </div>

      <div className="academy-account-card__grid">
        <Form.Item name="company_name" label="Company name">
          <Input
            maxLength={255}
            disabled={!isEditing}
            placeholder={companyPlaceholder}
            data-testid="input-company-name"
          />
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
      </div>

      <div className="academy-account-card__grid">
        <Form.Item name="sector" label="Sector">
          <Select
            allowClear
            showSearch
            disabled={!isEditing}
            placeholder="Select sector"
            data-testid="select-sector"
            options={sectorOptions}
          />
        </Form.Item>
        <Form.Item name="region_name" label="Region">
          <Select
            allowClear
            showSearch
            disabled={!isEditing}
            placeholder="Select region"
            data-testid="select-region"
            options={regionOptions}
          />
        </Form.Item>
      </div>

      <div className="academy-account-card__commodities">
        <Form.Item name="commodities" label="Commodities">
          <CommodityTagSelector disabled={!isEditing} />
        </Form.Item>
      </div>
    </div>
  );
};

export default AdditionalInfoCard;
