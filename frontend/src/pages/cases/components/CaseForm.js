import React, { useEffect, useMemo } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Input,
  Space,
  Tooltip,
  DatePicker,
  Select,
  Divider,
  Alert,
  Radio,
  Switch,
} from "antd";
import { InfoCircleTwoTone } from "@ant-design/icons";
import {
  countryOptions,
  focusCommodityOptions,
  commodityOptions,
  yesNoOptions,
  currencyOptions,
} from "../../../store/static";
import { selectProps, getFieldDisableStatusForCommodity } from "../../../lib";
import { AreaUnitFields, SegmentForm } from ".";
import { UIState } from "../../../store";
import dayjs from "dayjs";
import { CaseUIState, CurrentCaseState } from "../store";
import { uniqBy } from "lodash";

const responsiveCol = {
  xs: { span: 24 },
  sm: { span: 24 },
  md: { span: 24 },
  lg: { span: 12 },
  xl: { span: 12 },
};

const livestockPrompt = (
  <>
    In the case of multiple by-products from livestock, please insert
    information for each by-product separately. For example, in the case of
    cows, consider meat as the secondary commodity income source and milk as the
    tertiary income source. Only enter information for these by-products in
    detail if there is a commercial production system. If you do not have
    detailed information on the production system, we recommend inserting values
    on the next page under &apos;diversified income&apos; -&gt; &apos;income
    from livestock&apos;.
  </>
);

const SecondaryForm = ({
  index,
  indexLabel,
  disabled,
  disableAreaSizeUnitField,
  disableLandUnitField,
  disableDataOnIncomeDriverField,
}) => {
  const form = Form.useFormInstance();
  const caseUI = CaseUIState.useState((s) => s);

  const updateCaseUI = (key, value) => {
    CaseUIState.update((s) => ({
      ...s,
      [key]: value,
    }));
  };

  const handleOnChangeCommodity = (value) => {
    const { disableLandUnitField, disableDataOnIncomeDriverField } =
      getFieldDisableStatusForCommodity(value);
    const updatedValue = {
      ...caseUI[index],
      disableLandUnitField,
      disableDataOnIncomeDriverField,
    };
    // reset breakdown value land unit on disableLandUnitField
    if (disableLandUnitField) {
      form.setFieldValue(`${index}-area_size_unit`, null);
    }
    // reset breakdown value when disableDataOnIncomeDriverField
    if (disableDataOnIncomeDriverField) {
      form.setFieldValue(`${index}-breakdown`, null);
    }
    updateCaseUI(index, updatedValue);
  };

  return (
    <>
      <Col span={24}>
        <Form.Item
          name={`${index}-breakdown`}
          label={`Data on income drivers available?`}
          rules={[
            {
              required: !disabled && !disableDataOnIncomeDriverField,
              message: "Please select yes or no",
            },
          ]}
        >
          <Radio.Group
            disabled={disabled || disableDataOnIncomeDriverField}
            options={yesNoOptions}
            onChange={(e) =>
              updateCaseUI(index, {
                ...caseUI[index],
                disableAreaSizeField: e.target.value ? false : true,
              })
            }
          />
        </Form.Item>
      </Col>
      <Col {...responsiveCol}>
        <Form.Item
          name={`${index}-commodity`}
          label={`${indexLabel} Commodity`}
          rules={[
            {
              required: !disabled,
              message: "Commodity is required",
            },
          ]}
        >
          <Select
            placeholder={`Add your ${indexLabel} Commodity`}
            disabled={disabled}
            options={commodityOptions}
            onChange={handleOnChangeCommodity}
            {...selectProps}
          />
        </Form.Item>
      </Col>
      <Col {...responsiveCol}>
        <AreaUnitFields
          disabled={disabled || disableAreaSizeUnitField}
          index={index}
          disableLandUnitField={disableLandUnitField}
        />
      </Col>
      <Col span={24}>
        {/* PROMPT */}
        {disableLandUnitField ? (
          <Alert
            style={{
              marginTop: "-10px",
              marginBottom: "24px",
              fontSize: "13px",
            }}
            message={livestockPrompt}
            type="info"
          />
        ) : (
          ""
        )}
      </Col>
    </>
  );
};

const CaseForm = ({ updateCurrentCase = () => {} }) => {
  const form = Form.useFormInstance();
  const tagOptions = UIState.useState((s) => s.tagOptions);
  const companyOptions = UIState.useState((s) => s.companyOptions);
  const currentCase = CurrentCaseState.useState((s) => s);
  const { secondary, tertiary, general } = CaseUIState.useState((s) => s);
  const { enableEditCase } = general;

  const updateCaseUI = (key, value) => {
    CaseUIState.update((s) => ({
      ...s,
      [key]: value,
    }));
  };

  const filteredCurrencyOptions = useMemo(() => {
    if (!currentCase.country) {
      return uniqBy(currencyOptions, "value");
    }
    const countryCurrency = currencyOptions.find(
      (co) => co.country === currentCase.country
    );
    // set default currency value
    if (!currentCase?.id) {
      updateCurrentCase("currency", countryCurrency?.value);
    }
    let additonalCurrencies = currencyOptions.filter((co) =>
      ["eur", "usd"].includes(co.value.toLowerCase())
    );
    additonalCurrencies = uniqBy(additonalCurrencies, "value");
    return [countryCurrency, ...additonalCurrencies];
  }, [currentCase, updateCurrentCase]);

  useEffect(() => {
    // set default currency value
    if (!currentCase?.id && currentCase?.currency) {
      form.setFieldValue("currency", currentCase.currency);
    }
  }, [form, currentCase]);

  return (
    <Row gutter={[16, 16]}>
      {/* GENERAL INFORMATION */}
      <Col span={24}>
        <Card
          title="General Information"
          className="case-setting-child-card-wrapper"
          size="small"
          extra={
            <Form.Item style={{ marginBottom: 0 }}>
              <Switch
                size="small"
                checked={currentCase.private}
                onChange={(value) => updateCurrentCase("private", value)}
                disabled={!enableEditCase}
              />{" "}
              Private case
            </Form.Item>
          }
        >
          <Row gutter={[12, 12]}>
            <Col span={12}>
              <Form.Item
                label="Name of case"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Name of case is required",
                  },
                ]}
              >
                <Input disabled={!enableEditCase} />
              </Form.Item>
              <Form.Item
                label="Case description"
                name="description"
                rules={[
                  {
                    required: true,
                    message: "Case description is required",
                  },
                ]}
              >
                <Input.TextArea rows={5} disabled={!enableEditCase} />
              </Form.Item>
              <Form.Item
                name="country"
                label="Country"
                rules={[
                  {
                    required: true,
                    message: "Country is required",
                  },
                ]}
              >
                <Select
                  placeholder="Select country"
                  options={countryOptions}
                  {...selectProps}
                  onChange={(value) => updateCurrentCase("country", value)}
                  disabled={!enableEditCase}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="company" label="Company">
                <Select
                  placeholder="Select company"
                  options={companyOptions}
                  {...selectProps}
                  disabled={!enableEditCase}
                />
              </Form.Item>
              <Form.Item
                name="year"
                label={
                  <Space align="center">
                    <div>Year of available data</div>
                    <Tooltip
                      title="Please enter the year for which you are providing data. This year will also be used to retrieve a living income benchmark, if it is available for the specified region. If a benchmark for this year is not available, we will use the most recent available benchmark value."
                      placement="topRight"
                    >
                      <InfoCircleTwoTone twoToneColor="#1677ff" />
                    </Tooltip>
                  </Space>
                }
                rules={[
                  {
                    required: true,
                    message: "Choose year",
                  },
                ]}
              >
                <DatePicker
                  picker="year"
                  disabledDate={(current) => {
                    return current && dayjs(current).year() > dayjs().year();
                  }}
                  disabled={!enableEditCase}
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="Currency"
                name="currency"
                rules={[
                  {
                    required: true,
                    message: "Currency is required",
                  },
                ]}
              >
                <Select
                  placeholder="Select currency"
                  options={filteredCurrencyOptions}
                  {...selectProps}
                  disabled={!currentCase.country || !enableEditCase}
                />
              </Form.Item>
              <Form.Item
                name="tags"
                label="Tags"
                rules={[
                  {
                    required: true,
                    message: "Select at least one tag",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Add Tags"
                  options={tagOptions}
                  {...selectProps}
                  disabled={!enableEditCase}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
      {/* COMMODITIES */}
      <Col span={24}>
        <Card
          title="Commodities"
          className="case-setting-child-card-wrapper"
          size="small"
        >
          {/* 1 */}
          <Row gutter={[12, 12]}>
            <Col span={24} className="section-title">
              Primary commodity
            </Col>
            <Col {...responsiveCol}>
              <Form.Item
                label="Commodity"
                name="focus_commodity"
                rules={[
                  {
                    required: true,
                    message: "Commodity is required",
                  },
                ]}
              >
                <Select
                  placeholder="Select primary commodity"
                  options={focusCommodityOptions}
                  {...selectProps}
                  disabled={!enableEditCase}
                />
              </Form.Item>
            </Col>
            <Col {...responsiveCol}>
              <AreaUnitFields form={form} disabled={!enableEditCase} />
            </Col>
          </Row>
          <Divider />
          {/* 2 */}
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Space align="end">
                <div className="section-title">Secondary commodity</div>
                <Switch
                  size="small"
                  checked={secondary.enable}
                  onChange={(value) =>
                    updateCaseUI("secondary", { ...secondary, enable: value })
                  }
                  disabled={!enableEditCase}
                />
              </Space>
            </Col>
            <SecondaryForm
              index="secondary"
              indexLabel="Secondary"
              disabled={!secondary.enable || !enableEditCase}
              disableAreaSizeUnitField={secondary.disableAreaSizeField}
              disableLandUnitField={secondary.disableLandUnitField}
              disableDataOnIncomeDriverField={
                secondary.disableDataOnIncomeDriverField
              }
            />
          </Row>
          <Divider />
          {/* 3 */}
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Space align="end">
                <div className="section-title">Tertiary commodity</div>
                <Switch
                  size="small"
                  checked={tertiary.enable}
                  onChange={(value) =>
                    updateCaseUI("tertiary", { ...tertiary, enable: value })
                  }
                  disabled={!secondary.enable || !enableEditCase}
                />
              </Space>
            </Col>
            <SecondaryForm
              index="tertiary"
              indexLabel="Tertiary"
              disabled={!tertiary.enable || !enableEditCase}
              disableAreaSizeUnitField={tertiary.disableAreaSizeField}
              disableLandUnitField={tertiary.disableLandUnitField}
              disableDataOnIncomeDriverField={
                tertiary.disableDataOnIncomeDriverField
              }
            />
          </Row>
        </Card>
      </Col>
      {/* SEGMENTATION */}
      <Col span={24}>
        <Card
          title="Segmentation"
          className="case-setting-child-card-wrapper"
          size="small"
        >
          <SegmentForm />
        </Card>
      </Col>
    </Row>
  );
};

export default CaseForm;
