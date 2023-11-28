import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Form,
  Input,
  Select,
  Radio,
  Row,
  Col,
  Card,
  Switch,
  Button,
  Space,
  message,
  DatePicker,
  Checkbox,
  Modal,
  Spin,
  Table,
  Divider,
} from "antd";
import {
  StepForwardOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import {
  AreaUnitFields,
  commodityOptions,
  countryOptions,
  currencyOptions,
  reportingPeriod,
  selectProps,
  yesNoOptions,
} from "./";
import { api } from "../../../lib";
import { UIState, UserState } from "../../../store";
import isEmpty from "lodash/isEmpty";
import uniqBy from "lodash/uniqBy";
import debounce from "lodash/debounce";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { casePermission } from "../../../store/static";

const responsiveCol = {
  xs: { span: 24 },
  sm: { span: 24 },
  md: { span: 24 },
  lg: { span: 12 },
  xl: { span: 12 },
};

const CaseForm = ({
  form,
  setCaseTitle,
  selectedCountry,
  setSelectedCountry,
  filteredCurrencyOptions,
  privateCase,
  setPrivateCase,
}) => {
  const tagOptions = UIState.useState((s) => s.tagOptions);

  return (
    <>
      <h3>General Information</h3>
      <Form.Item
        label="Name of Case"
        name="name"
        rules={[
          {
            required: true,
            message: "Name of Case is required",
          },
        ]}
        onChange={(e) => setCaseTitle(e.target.value)}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Case Description"
        name="description"
        rules={[
          {
            required: true,
            message: "Case Description is required",
          },
        ]}
      >
        <Input.TextArea />
      </Form.Item>

      <Form.Item>
        <Checkbox
          checked={privateCase}
          onChange={() => setPrivateCase(!privateCase)}
        >
          Private Case
        </Checkbox>
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
        />
      </Form.Item>

      <Form.Item
        name="year"
        label="Year"
        rules={[
          {
            required: true,
            message: "Select year",
          },
        ]}
      >
        <DatePicker
          picker="year"
          disabledDate={(current) => {
            return current && dayjs(current).year() > dayjs().year();
          }}
        />
      </Form.Item>

      <h3>Driver Details</h3>

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
          placeholder="Select Country"
          options={countryOptions}
          {...selectProps}
          onChange={setSelectedCountry}
        />
      </Form.Item>
      <Row gutter={[12, 12]}>
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
              placeholder="Select Focus Commodity"
              options={commodityOptions}
              {...selectProps}
            />
          </Form.Item>
        </Col>
        <Col {...responsiveCol}>
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
              placeholder="Select Currency"
              options={filteredCurrencyOptions}
              {...selectProps}
              disabled={!selectedCountry}
            />
          </Form.Item>
        </Col>
      </Row>
      <AreaUnitFields form={form} disabled={false} />
      <Form.Item
        label="Reporting Period"
        name="reporting_period"
        rules={[
          {
            required: true,
            message: "Reporting Period is required",
          },
        ]}
      >
        <Radio.Group
          options={reportingPeriod}
          optionType="button"
          buttonStyle="solid"
        />
      </Form.Item>
    </>
  );
};

const SecondaryForm = ({
  index,
  indexLabel,
  disabled,
  disableAreaSizeUnitField,
}) => {
  return (
    <>
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
          {...selectProps}
        />
      </Form.Item>
      <Form.Item
        name={`${index}-breakdown`}
        label={`Data on income drivers available`}
        rules={[
          {
            required: !disabled,
            message: "Please select yes or no",
          },
        ]}
      >
        <Radio.Group disabled={disabled} options={yesNoOptions} />
      </Form.Item>
      <AreaUnitFields
        disabled={disabled || disableAreaSizeUnitField}
        index={index}
      />
    </>
  );
};

{
  /* Support add User Access */
}
const DebounceSelect = ({ fetchOptions, debounceTimeout = 800, ...props }) => {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState([]);
  const fetchRef = useRef(0);

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);
      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }
        setOptions(newOptions);
        setFetching(false);
      });
    };
    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);

  return (
    <Select
      labelInValue
      showSearch
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      {...props}
      options={options}
    />
  );
};

const CaseProfile = ({
  setCaseTitle,
  setPage,
  formData,
  setFormData,
  finished,
  setFinished,
  commodityList,
  setCommodityList,
  currentCaseId,
  setCurrentCaseId,
  initialOtherCommodityTypes,
  setCurrentCase,
  currentCase,
}) => {
  const [form] = Form.useForm();
  const [secondary, setSecondary] = useState(commodityList.length > 2);
  const [tertiary, setTertiary] = useState(commodityList.length > 3);
  const [isSaving, setIsSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { caseId } = useParams();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [disableAreaSizeSecondaryField, setDisableAreaSizeSecondaryField] =
    useState(true);
  const [disableAreaSizeTertiaryField, setDisableAreaSizeTertiaryField] =
    useState(true);
  const [isNextButton, setIsNextButton] = useState(false);
  const [privateCase, setPrivateCase] = useState(false);

  {
    /* Support add User Access */
  }
  const userEmail = UserState.useState((s) => s.email);
  const isCaseOwner = userEmail === currentCase?.created_by;
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [userCaseAccess, setUserCaseAccess] = useState([]);
  const [userCaseAccessDataSource, setUserCaseAccessDataSource] = useState([]);

  const navigate = useNavigate();

  const filteredCurrencyOptions = useMemo(() => {
    if (!selectedCountry) {
      return uniqBy(currencyOptions, "value");
    }
    const countryCurrency = currencyOptions.find(
      (co) => co.country === selectedCountry
    );
    // set default currency value
    if (isEmpty(formData)) {
      form.setFieldsValue({ currency: countryCurrency?.value });
    }
    // TODO: Wrong format when store to db
    let additonalCurrencies = currencyOptions.filter((co) =>
      ["eur", "usd"].includes(co.value.toLowerCase())
    );
    additonalCurrencies = uniqBy(additonalCurrencies, "value");
    return [countryCurrency, ...additonalCurrencies];
  }, [selectedCountry, form, formData]);

  useEffect(() => {
    // initial case profile value
    if (!isEmpty(formData)) {
      commodityList.forEach((cm) => {
        // handle enable disable area size field for other commodities
        if (cm.commodity_type === "secondary") {
          setDisableAreaSizeSecondaryField(!cm.breakdown);
        }
        if (cm.commodity_type === "tertiary") {
          setDisableAreaSizeTertiaryField(!cm.breakdown);
        }
      });
      const completed = finished.filter((item) => item !== "Case Profile");
      if (initialOtherCommodityTypes?.includes("secondary")) {
        setSecondary(true);
      }
      if (initialOtherCommodityTypes?.includes("tertiary")) {
        setTertiary(true);
      }
      if (formData?.country) {
        setSelectedCountry(formData.country);
      }
      setPrivateCase(formData?.private || false);
      setFinished([...completed, "Case Profile"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const onFinish = (values) => {
    setIsSaving(true);
    setFormData(values);
    const completed = finished.filter((item) => item !== "Case Profile");

    let other_commodities = [];
    const initial_commodities = {
      commodity: values.focus_commodity,
      breakdown: true,
      currency: values.currency,
      area_size_unit: values.area_size_unit,
      volume_measurement_unit: values.volume_measurement_unit,
      commodity_type: "focus",
    };
    let commodities = [initial_commodities];
    if (secondary) {
      commodities = [
        ...commodities,
        {
          commodity: values["1-commodity"],
          breakdown: values["1-breakdown"] ? true : false,
          currency: values.currency,
          area_size_unit: values["1-area_size_unit"],
          volume_measurement_unit: values["1-volume_measurement_unit"],
          commodity_type: "secondary",
        },
      ];
      other_commodities = [
        ...other_commodities,
        {
          commodity: values["1-commodity"],
          breakdown: values["1-breakdown"] ? true : false,
          commodity_type: "secondary",
          area_size_unit: values["1-area_size_unit"],
          volume_measurement_unit: values["1-volume_measurement_unit"],
        },
      ];
    }
    if (tertiary) {
      commodities = [
        ...commodities,
        {
          commodity: values["2-commodity"],
          breakdown: values["2-breakdown"] ? true : false,
          currency: values.currency,
          area_size_unit: values["2-area_size_unit"],
          volume_measurement_unit: values["2-volume_measurement_unit"],
          commodity_type: "tertiary",
        },
      ];
      other_commodities = [
        ...other_commodities,
        {
          commodity: values["2-commodity"],
          breakdown: values["2-breakdown"] ? true : false,
          commodity_type: "tertiary",
          area_size_unit: values["2-area_size_unit"],
          volume_measurement_unit: values["2-volume_measurement_unit"],
        },
      ];
    }
    // diversified_commodities
    commodities = [
      ...commodities,
      {
        ...initial_commodities,
        commodity_type: "diversified",
        commodity: null,
      },
    ];
    const payload = {
      name: values.name,
      description: values.description,
      country: values.country,
      focus_commodity: values.focus_commodity,
      year: dayjs(values.year).year(),
      currency: values.currency,
      area_size_unit: values.area_size_unit,
      volume_measurement_unit: values.volume_measurement_unit,
      reporting_period: values.reporting_period,
      multiple_commodities: secondary || tertiary,
      // need to handle below value correctly
      cost_of_production_unit: "cost_of_production_unit",
      segmentation: true,
      living_income_study: null,
      logo: null,
      private: privateCase,
      other_commodities: other_commodities,
      tags: values.tags || null,
    };

    const paramCaseId = caseId ? caseId : currentCaseId;
    const apiCall =
      currentCaseId || caseId
        ? api.put(`case/${paramCaseId}`, payload)
        : api.post("case", payload);
    apiCall
      .then((res) => {
        const { data } = res;
        setCurrentCaseId(data?.id);
        setCurrentCase(data);
        const transformCommodities = commodities.map((cm) => {
          const findCm = data.case_commodities.find(
            (dcm) => dcm.commodity_type === cm.commodity_type
          );
          return {
            ...cm,
            case_commodity: findCm.id,
          };
        });
        messageApi.open({
          type: "success",
          content: "Case profile saved successfully.",
        });
        setTimeout(() => {
          setCommodityList(transformCommodities);
          setFinished([...completed, "Case Profile"]);
        }, 500);
        if (isNextButton) {
          setPage("Income Driver Data Entry");
        }
      })
      .catch((e) => {
        console.error(e);
        messageApi.open({
          type: "error",
          content: "Failed to save case profile.",
        });
        setFinished(completed);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const onFinishFailed = () => {
    setFinished(finished.filter((item) => item !== "Case Profile"));
  };

  const onValuesChange = (changedValues, allValues) => {
    // secondary breakdown handle
    if (changedValues?.["1-breakdown"] === 0) {
      form.setFieldsValue({
        ["1-area_size_unit"]: null,
        ["1-volume_measurement_unit"]: null,
      });
    }
    // tertiary breakdown handle
    if (changedValues?.["2-breakdown"] === 0) {
      form.setFieldsValue({
        ["2-area_size_unit"]: null,
        ["2-volume_measurement_unit"]: null,
      });
    }
    setDisableAreaSizeSecondaryField(allValues?.["1-breakdown"] ? false : true);
    setDisableAreaSizeTertiaryField(allValues?.["2-breakdown"] ? false : true);
  };

  {
    /* Support add User Access */
  }
  const fetchUsers = (searchValue) => {
    return api
      .get(`user/search_dropdown?search=${searchValue}`)
      .then((res) => res.data);
  };

  {
    /* Support add User Access */
  }
  const handleOnChangeSearchUser = (newValue) => {
    setSelectedUser(newValue);
    setUserCaseAccess([...userCaseAccess, newValue]);
  };

  {
    /* Support add User Access */
  }
  const handleOnChangePermission = (value) => {
    setSelectedPermission(value);
    setUserCaseAccess((prev) => {
      const checkPrev = prev.find((p) => p.value === selectedUser.value);
      if (checkPrev) {
        return [
          ...prev.filter((p) => p.value !== selectedUser.value),
          {
            ...checkPrev,
            permission: value,
          },
        ];
      }
      return prev;
    });
  };

  {
    /* Support add User Access */
  }
  const handleOnClickAddUserCaseAccess = () => {
    const transformed = userCaseAccess.map((d) => ({
      user: d.label,
      label: d.label,
      value: d.value,
      permission: d.permission,
    }));
    setUserCaseAccessDataSource(transformed);
    setSelectedUser(null);
    setSelectedPermission(null);
  };

  {
    /* Support add User Access */
  }
  const handleOnClickRemoveUserAccess = (row) => {
    setUserCaseAccess((prev) => {
      return prev.filter((p) => p.value !== row.value);
    });
    setUserCaseAccessDataSource((prev) => {
      return prev.filter((p) => p.value !== row.value);
    });
  };

  return (
    <>
      <Form
        form={form}
        name="basic"
        layout="vertical"
        initialValues={formData}
        onValuesChange={onValuesChange}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        {contextHolder}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card
              title="Case Details"
              extra={
                isCaseOwner && (
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    type="primary"
                    style={{ borderRadius: "10px" }}
                    onClick={() => setShowModal(true)}
                  >
                    Share
                  </Button>
                )
              }
            >
              <CaseForm
                setCaseTitle={setCaseTitle}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                filteredCurrencyOptions={filteredCurrencyOptions}
                privateCase={privateCase}
                setPrivateCase={setPrivateCase}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title="Secondary Commodity"
              extra={<Switch checked={secondary} onChange={setSecondary} />}
              style={{
                marginBottom: "16px",
                backgroundColor: !secondary ? "#f5f5f5" : "white",
              }}
            >
              <SecondaryForm
                index={1}
                indexLabel="Secondary"
                disabled={!secondary}
                disableAreaSizeUnitField={disableAreaSizeSecondaryField}
              />
            </Card>
            <Card
              title="Teritary Commodity"
              extra={
                <Switch
                  checked={tertiary}
                  onChange={setTertiary}
                  disabled={!secondary}
                />
              }
              style={{
                backgroundColor: !tertiary ? "#f5f5f5" : "white",
              }}
            >
              <SecondaryForm
                index={2}
                indexLabel="Teritary"
                disabled={!tertiary}
                disableAreaSizeUnitField={disableAreaSizeTertiaryField}
              />
            </Card>
            <Row>
              <Col span={12}>
                <Button
                  className="button button-submit button-secondary"
                  onClick={() => navigate("/cases")}
                >
                  Cancel
                </Button>
              </Col>
              <Col
                span={12}
                style={{
                  justifyContent: "flex-end",
                  display: "grid",
                }}
              >
                <Space size={[8, 16]} wrap>
                  <Button
                    htmlType="submit"
                    className="button button-submit button-secondary"
                    loading={isSaving}
                    onClick={() => setIsNextButton(false)}
                  >
                    Save
                  </Button>
                  <Button
                    htmlType="submit"
                    className="button button-submit button-secondary"
                    loading={isSaving}
                    onClick={() => setIsNextButton(true)}
                  >
                    Next
                    <StepForwardOutlined />
                  </Button>
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
      {/* Support add User Access */}
      <Modal
        title="Share Case Access to Users"
        open={showModal}
        // onOk={handleOk}
        // confirmLoading={confirmLoading}
        onCancel={() => setShowModal(false)}
        width={650}
      >
        <Row gutter={[16, 16]} align="center">
          <Col span={12}>
            <DebounceSelect
              placeholder="Search for a user"
              value={selectedUser}
              fetchOptions={fetchUsers}
              onChange={handleOnChangeSearchUser}
              style={{
                width: "100%",
              }}
            />
          </Col>
          <Col span={8}>
            <Select
              showSearch
              value={selectedPermission}
              placeholder="Select permission"
              options={casePermission.map((x) => ({ label: x, value: x }))}
              optionFilterProp="label"
              style={{ width: "100%" }}
              onChange={handleOnChangePermission}
            />
          </Col>
          <Col span={4} align="end" style={{ float: "right" }}>
            <Button onClick={() => handleOnClickAddUserCaseAccess()}>
              Add
            </Button>
          </Col>
        </Row>
        <Divider />
        <Table
          size="small"
          columns={[
            {
              key: "user",
              title: "User",
              width: "65%",
              render: (row) => {
                return row?.label || row?.user;
              },
            },
            {
              key: "permission",
              title: "Permission",
              dataIndex: "permission",
            },
            {
              key: "action",
              render: (row) => {
                return (
                  <Button
                    size="small"
                    type="ghost"
                    icon={<MinusCircleOutlined />}
                    onClick={() => handleOnClickRemoveUserAccess(row)}
                  />
                );
              },
            },
          ]}
          dataSource={userCaseAccessDataSource}
          bordered
          title={() => <b>User Case Access</b>}
          pagination={false}
        />
      </Modal>
    </>
  );
};

export default CaseProfile;
