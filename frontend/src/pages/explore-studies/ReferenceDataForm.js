import React, { useState, useEffect } from "react";
import "./explore-studies-page.scss";
import {
  Form,
  Input,
  Card,
  Row,
  Col,
  Select,
  Spin,
  InputNumber,
  Modal,
  Tooltip,
  Space,
} from "antd";
import { api } from "../../lib";
import { InputNumberThousandFormatter } from "../cases/components";
import { QuestionCircleOutlined } from "@ant-design/icons";

const selectProps = {
  showSearch: true,
  allowClear: true,
  optionFilterProp: "label",
  style: {
    width: "100%",
  },
};

const confidenceLevelOptions = [
  {
    label: "High",
    value: "high",
  },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
  { label: "Undefined", value: "undefined" },
];

const rangeOptions = [
  { label: "Low value", value: "low value" },
  { label: "Median value", value: "median value" },
  {
    label: "High value",
    value: "high value",
  },
];

const typeOptions = [
  { label: "Mean", value: "mean" },
  { label: "Median", value: "median" },
  { label: "Maximum", value: "maximum" },
  { label: "Minimum", value: "minimum" },
];

const sources = ["Farmfit", "Desk research", "IDH internal", "FAO", "Other"];
const sourceOptions = sources.map((x) => ({ label: x, value: x }));

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const LabelWithTooltip = ({ name, tooltip }) => (
  <Space align="center">
    <div>{name}</div>
    <Tooltip placement="right" title={tooltip} color="#26605f">
      <QuestionCircleOutlined />
    </Tooltip>
  </Space>
);

const ReferenceDataForm = ({
  open = false,
  setOpen,
  referenceDataId = null,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [initValues, setInitValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const commodityOptions = window?.master?.commodity_categories?.flatMap((ct) =>
    ct.commodities.map((c) => ({
      label: c.name,
      value: c.id,
      category: ct.name,
    }))
  );
  const countryOptions = window?.master?.countries || [];

  useEffect(() => {
    setInitValues({});
    form.resetFields();
    if (referenceDataId) {
      setLoading(true);
      api
        .get(`reference_data/${referenceDataId}`)
        .then((res) => {
          setInitValues(res.data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [referenceDataId, form]);

  const clearForm = () => {
    form.resetFields();
    setInitValues({});
  };

  const onFinish = (values) => {
    // transform values
    const payload = {
      ...values,
      currency: "",
    };
    onSave({
      payload: payload,
      setConfirmLoading: setConfirmLoading,
      resetFields: () => {
        clearForm();
        setTimeout(() => {
          setOpen(false);
        }, 250);
      },
    });
  };

  return (
    <Modal
      title="Reference Data Details"
      open={open}
      onOk={() => form.submit()}
      confirmLoading={confirmLoading}
      onCancel={() => {
        clearForm();
        setOpen(false);
      }}
      width="90%"
      okText="Save"
      keyboard={false}
      destroyOnClose={true}
    >
      {loading ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        <Form
          form={form}
          name="reference-form"
          layout="vertical"
          initialValues={initValues}
          onFinish={onFinish}
          className="reference-form-container"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="General">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      label="Country"
                      name="country"
                      rules={[
                        {
                          required: true,
                          message: "Country is required",
                        },
                      ]}
                    >
                      <Select {...selectProps} options={countryOptions} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <LabelWithTooltip
                          name="Region"
                          tooltip={`Enter "National" if no region defined as part of the study`}
                        />
                      }
                      name="region"
                      rules={[
                        {
                          required: true,
                          message: "Region is required",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  {/* <Col span={12}>
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
                        {...selectProps}
                        options={filteredCurrencyOptions}
                        disabled={!selectedCountry}
                      />
                    </Form.Item>
                  </Col> */}
                  <Col span={12}>
                    <Form.Item
                      label="Commodity"
                      name="commodity"
                      rules={[
                        {
                          required: true,
                          message: "Commodity is required",
                        },
                      ]}
                    >
                      <Select {...selectProps} options={commodityOptions} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Year"
                      name="year"
                      rules={[
                        {
                          required: true,
                          message: "Year is required",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      label="Source"
                      name="source"
                      rules={[
                        {
                          required: true,
                          message: "Source is required",
                        },
                      ]}
                    >
                      <Select {...selectProps} options={sourceOptions} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Link"
                      name="link"
                      rules={[
                        {
                          required: true,
                          message: "Link for source is required",
                        },
                        () => ({
                          validator(_, value) {
                            if (isValidUrl(value)) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error(
                                "Please provide a valid URL, e.g. https://example.com."
                              )
                            );
                          },
                        }),
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="Notes" name="notes">
                      <Input.TextArea rows={4} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Details about the data">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item
                      label={
                        <LabelWithTooltip
                          name="Confidence Level"
                          tooltip="Assess level of confidence you have with regards to the reliability of this source"
                        />
                      }
                      name="confidence_level"
                    >
                      <Select
                        {...selectProps}
                        options={confidenceLevelOptions}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={
                        <LabelWithTooltip
                          name="Range"
                          tooltip="If known, indicate whether the reference values are rather low, median or high values for the particular context"
                        />
                      }
                      name="range"
                    >
                      <Select {...selectProps} options={rangeOptions} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Type" name="type">
                      <Select {...selectProps} options={typeOptions} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Drivers Value">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item label="Area" name="area">
                      <InputNumber
                        keyboard={false}
                        {...InputNumberThousandFormatter}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Measurement Unit for Area"
                      name="area_size_unit"
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item label="Volume" name="volume">
                      <InputNumber
                        keyboard={false}
                        {...InputNumberThousandFormatter}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Measurement Unit for Volume"
                      name="volume_measurement_unit"
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item label="Price" name="price">
                      <InputNumber
                        keyboard={false}
                        {...InputNumberThousandFormatter}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Measurement Unit for Price"
                      name="price_unit"
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      label="Cost of Production"
                      name="cost_of_production"
                    >
                      <InputNumber
                        keyboard={false}
                        {...InputNumberThousandFormatter}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Measurement Unit for Cost of Production"
                      name="cost_of_production_unit"
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      label="Diversified Income"
                      name="diversified_income"
                    >
                      <InputNumber
                        keyboard={false}
                        {...InputNumberThousandFormatter}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Measurement Unit for Diversified Income"
                      name="diversified_income_unit"
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Form>
      )}
    </Modal>
  );
};

export default ReferenceDataForm;
