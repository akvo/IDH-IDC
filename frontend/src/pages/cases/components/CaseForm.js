import React, { useEffect, useMemo, useState } from "react";
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
  Tabs,
  Button,
  Upload,
  message,
} from "antd";
import {
  countryOptions,
  focusCommodityOptions,
  commodityOptions,
  yesNoOptions,
  currencyOptions,
} from "../../../store/static";
import { selectProps, getFieldDisableStatusForCommodity } from "../../../lib";
import { AreaUnitFields, SegmentForm, SegmentConfigurationForm } from ".";
import { UIState } from "../../../store";
import dayjs from "dayjs";
import { CaseUIState, CurrentCaseState } from "../store";
import { uniqBy } from "lodash";
import { QuestionCircleOutline } from "../../../lib/icon";
import { DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { api } from "../../../lib";

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

// TODO:: Update case_import case_id column after saving the case, by adding import_id to payload
const { Dragger } = Upload;

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

const CaseForm = ({
  deletedSegmentIds = [],
  updateCurrentCase = () => {},
  setDeletedSegmentIds = () => {},
  dataUploadFieldPreffix = "",
}) => {
  const form = Form.useFormInstance();
  const tagOptions = UIState.useState((s) => s.tagOptions);
  const companyOptions = UIState.useState((s) => s.companyOptions);
  const currentCase = CurrentCaseState.useState((s) => s);
  const { secondary, tertiary, general } = CaseUIState.useState((s) => s);
  const { enableEditCase } = general;

  const [messageApi, contextHolder] = message.useMessage();
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx",
    disabled: uploading, // Disable while uploading
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      setUploading(true); // Set uploading to true at start

      try {
        const response = await api.upload("/case-import", file, {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress({ percent });
          },
        });

        const result = response.data;
        setUploadResult(result);
        if (result.import_id) {
          form.setFieldValue("import_id", result.import_id);
        }
        onSuccess(result, file);
        messageApi.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        onError(error);
        messageApi.error(`${file.name} upload failed`);
      } finally {
        setUploading(false); // Re-enable after upload completes (success or error)
      }
    },
    onChange(info) {
      const { status } = info.file;

      if (status === "uploading") {
        console.info("Progress:", info.file.percent + "%");
      }

      if (status === "done") {
        const result = info.file.response;
        console.info("Upload completed with result:", result);
      } else if (status === "error") {
        console.error("Upload failed");
      }
    },
    showUploadList: true,
    maxCount: 1,
  };

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
    <Row gutter={[16, 16]} className="case-form-body-wrapper">
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
              Private case{" "}
              <Tooltip title="The details of a private case are visible only to you and any users you choose to add to the case.">
                <span>
                  <QuestionCircleOutline size={14} />
                </span>
              </Tooltip>
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
                      <span>
                        <QuestionCircleOutline size={14} />
                      </span>
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
                    const currentYear = dayjs().year();
                    const selectedYear = dayjs(current).year();
                    return selectedYear < 2020 || selectedYear > currentYear;
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
      {/* MANUAL / DATA UPLOAD */}
      <Col span={24}>
        <Tabs
          items={[
            {
              key: "manual",
              label: "Manual data input",
              children: (
                <Col span={24}>
                  {/* SEGMENTATION */}
                  <Card
                    title="Create up to 5 segments"
                    className="case-setting-child-card-wrapper"
                    size="small"
                  >
                    <SegmentForm
                      deletedSegmentIds={deletedSegmentIds}
                      setDeletedSegmentIds={setDeletedSegmentIds}
                    />
                  </Card>
                </Col>
              ),
            },
            {
              key: "upload",
              label: "Data upload",
              children: (
                <Col span={24}>
                  {contextHolder}
                  <h3>Upload your data</h3>
                  <Dragger {...uploadProps}>
                    <p className="ant-upload-drag-icon">
                      <FileExcelOutlined />
                    </p>
                    <p className="ant-upload-text">
                      {uploading
                        ? "Uploading..."
                        : "Select a xlsx file to import"}
                    </p>
                    <p className="ant-upload-hint">
                      {uploading
                        ? "Please wait while the file is being uploaded"
                        : "Drag and drop file here or click to upload"}
                    </p>
                    <Button className="button-browse-file" disabled={uploading}>
                      {uploading ? "Uploading..." : "Browse files"}
                    </Button>
                  </Dragger>
                  <Form.Item name="import_id" hidden>
                    <input type="hidden" />
                  </Form.Item>

                  {uploadResult && (
                    <div style={{ marginTop: 16 }}>
                      <SegmentConfigurationForm
                        dataUploadFieldPreffix={dataUploadFieldPreffix}
                        uploadResult={uploadResult}
                      />
                      <h3>Upload Result:</h3>
                      <pre>{JSON.stringify(uploadResult, null, 2)}</pre>
                    </div>
                  )}
                </Col>
              ),
            },
          ]}
          tabBarExtraContent={
            <Button className="button-ghost">
              <DownloadOutlined /> Download template
            </Button>
          }
        />
      </Col>
    </Row>
  );
};

export default CaseForm;
