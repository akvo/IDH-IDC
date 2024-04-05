import React, { useState, useEffect, useMemo } from "react";
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
  Table,
  Divider,
  Tooltip,
} from "antd";
import {
  StepForwardOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  InfoCircleTwoTone,
} from "@ant-design/icons";
import {
  AreaUnitFields,
  commodities,
  focusCommodityOptions,
  commodityOptions,
  countryOptions,
  currencyOptions,
  selectProps,
  yesNoOptions,
  DebounceSelect,
  removeUndefinedObjectValue,
} from "./";
import { api } from "../../../lib";
import { UIState, UserState } from "../../../store";
import isEmpty from "lodash/isEmpty";
import uniqBy from "lodash/uniqBy";
import isEqual from "lodash/isEqual";
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
  setCaseDescription,
  selectedCountry,
  setSelectedCountry,
  filteredCurrencyOptions,
  privateCase,
  setPrivateCase,
  enableEditCase,
}) => {
  const tagOptions = UIState.useState((s) => s.tagOptions);

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card
          title="General Information"
          className="case-detail-child-card-wrapper"
        >
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
            <Input disabled={!enableEditCase} />
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
            <Input.TextArea
              onChange={(e) => setCaseDescription(e.target.value)}
              rows={4}
              disabled={!enableEditCase}
            />
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={privateCase}
              onChange={() => setPrivateCase(!privateCase)}
              disabled={!enableEditCase}
            >
              Private Case
            </Checkbox>
          </Form.Item>

          <Form.Item
            name="year"
            label={
              <Space align="center">
                <div>Year</div>
                <Tooltip
                  title="Year for which you are entering data. This also the year for which we are retrieving a living income benchmark (if available)."
                  placement="topRight"
                >
                  <InfoCircleTwoTone twoToneColor="#1677ff" />
                </Tooltip>
              </Space>
            }
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
              disabled={!enableEditCase}
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
        </Card>
      </Col>
      <Col span={24}>
        <Card
          title="Details about the data"
          className="case-detail-child-card-wrapper"
        >
          <Row gutter={[12, 12]}>
            <Col {...responsiveCol}>
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
                  disabled={!enableEditCase}
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
                  disabled={!selectedCountry || !enableEditCase}
                />
              </Form.Item>
            </Col>
          </Row>
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
                  placeholder="Select Primary Commodity"
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
        </Card>
      </Col>
    </Row>
  );
};

const SecondaryForm = ({
  index,
  indexLabel,
  disabled,
  disableAreaSizeUnitField,
  disableLandUnitField,
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
        disableLandUnitField={disableLandUnitField}
      />
    </>
  );
};

const CaseProfile = ({
  setCaseTitle,
  setCaseDescription,
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
  enableEditCase,
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
  const [currentCaseProfile, setCurrentCaseProfile] = useState({});

  const [disableSecondaryLandUnitField, setDisableSecondaryLandUnitField] =
    useState(false);
  const [disableTertiaryLandUnitField, setDisableTertiaryLandUnitField] =
    useState(false);

  useEffect(
    () => {
      setCurrentCaseProfile(formData);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  {
    /* Support add User Access */
  }
  const { id: userId, email: userEmail } = UserState.useState((s) => s);
  const isCaseOwner =
    userEmail === currentCase?.created_by || userId === currentCase?.created_by;
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [userCaseAccessDataSource, setUserCaseAccessDataSource] = useState([]);
  const [loadingUserCase, setLoadingUserCase] = useState(false);

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
      multiple_commodities: secondary || tertiary,
      reporting_period: "per-year",
      // TODO:: need to handle below value correctly
      cost_of_production_unit: "cost_of_production_unit",
      segmentation: true,
      living_income_study: null,
      logo: null,
      private: privateCase,
      other_commodities: other_commodities,
      tags: values.tags || null,
    };

    // detect is payload updated
    const filteredCurrentCaseProfile =
      removeUndefinedObjectValue(currentCaseProfile);
    const filteredValues = {
      ...filteredCurrentCaseProfile,
      ...removeUndefinedObjectValue(values),
      private: privateCase,
      reporting_period: "per-year",
    };
    const isUpdated = !isEqual(filteredCurrentCaseProfile, filteredValues);

    const paramCaseId = caseId ? caseId : currentCaseId;
    const apiCall =
      currentCaseId || caseId
        ? api.put(`case/${paramCaseId}?updated=${isUpdated}`, payload)
        : api.post("case", payload);
    apiCall
      .then((res) => {
        setCurrentCaseProfile(filteredValues);
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
        const { status, data } = e.response;
        let errorText = "Failed to save case profile.";
        if (status === 403) {
          errorText = data.detail;
          if (isNextButton) {
            setFinished([...completed, "Case Profile"]);
            setPage("Income Driver Data Entry");
          }
        }
        messageApi.open({
          type: "error",
          content: errorText,
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
    // handle secondary commodity
    if (changedValues?.["1-commodity"] || allValues?.["1-commodity"]) {
      const checkSecondaryCommodity = commodities.find(
        (c) =>
          c.id === changedValues["1-commodity"] ||
          c.id === allValues["1-commodity"]
      );
      setDisableSecondaryLandUnitField(
        checkSecondaryCommodity?.category?.toLowerCase() === "livestock"
          ? true
          : false
      );
    } else {
      setDisableSecondaryLandUnitField(false);
    }
    // handle tertiary commodity
    if (changedValues?.["2-commodity"] || allValues?.["2-commodity"]) {
      const checkTertiaryCommodity = commodities.find(
        (c) =>
          c.id === changedValues["2-commodity"] ||
          c.id === allValues["2-commodity"]
      );
      setDisableTertiaryLandUnitField(
        checkTertiaryCommodity?.category?.toLowerCase() === "livestock"
          ? true
          : false
      );
    } else {
      setDisableTertiaryLandUnitField(false);
    }
  };

  /* Support add User Access */
  const fetchUsers = (searchValue) => {
    return api
      .get(`user/search_dropdown?search=${searchValue}`)
      .then((res) => res.data);
  };

  {
    /* Support add User Access */
  }
  const handleOnClickAddUserCaseAccess = () => {
    setLoadingUserCase(true);
    const payload = {
      user: selectedUser?.value,
      permission: selectedPermission,
    };
    const paramCaseId = caseId ? caseId : currentCaseId;
    api
      .post(`case_access/${paramCaseId}`, payload)
      .then((res) => {
        setUserCaseAccessDataSource((prev) => {
          return [...prev, res.data];
        });
        setSelectedUser(null);
        setSelectedPermission(null);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setLoadingUserCase(false);
      });
  };

  {
    /* Support add User Access */
  }
  const handleOnClickRemoveUserAccess = (row) => {
    const paramCaseId = caseId ? caseId : currentCaseId;
    api.delete(`case_access/${paramCaseId}?access_id=${row.id}`).then(() => {
      setUserCaseAccessDataSource((prev) => {
        return prev.filter((p) => p.id !== row.id);
      });
    });
  };

  {
    /* Support add User Access */
  }
  const handleOnClickShareAccess = () => {
    const paramCaseId = caseId ? caseId : currentCaseId;
    api.get(`case_access/${paramCaseId}`).then((res) => {
      setUserCaseAccessDataSource(res.data);
      setTimeout(() => {
        setShowModal(true);
      }, 100);
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
        <Card
          title="Case Details"
          extra={
            isCaseOwner && (
              <Button
                icon={<PlusOutlined />}
                size="small"
                type="primary"
                style={{ borderRadius: "10px" }}
                onClick={() => handleOnClickShareAccess()}
              >
                Share
              </Button>
            )
          }
          className="case-detail-card-wrapper"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <CaseForm
                setCaseTitle={setCaseTitle}
                setCaseDescription={setCaseDescription}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                filteredCurrencyOptions={filteredCurrencyOptions}
                privateCase={privateCase}
                setPrivateCase={setPrivateCase}
                enableEditCase={enableEditCase}
              />
            </Col>
            <Col span={24}>
              <Card
                title={
                  <Space align="end">
                    <Switch
                      size="small"
                      checked={secondary}
                      onChange={setSecondary}
                      disabled={!enableEditCase}
                    />
                    <div style={{ lineHeight: 1.2 }}>Secondary Commodity</div>
                  </Space>
                }
                style={{
                  backgroundColor: !secondary ? "#f5f5f5" : "white",
                }}
                className="case-detail-child-card-wrapper"
              >
                <SecondaryForm
                  index={1}
                  indexLabel="Secondary"
                  disabled={!secondary || !enableEditCase}
                  disableAreaSizeUnitField={disableAreaSizeSecondaryField}
                  disableLandUnitField={disableSecondaryLandUnitField}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card
                title={
                  <Space align="end">
                    <Switch
                      size="small"
                      checked={tertiary}
                      onChange={setTertiary}
                      disabled={!secondary || !enableEditCase}
                    />
                    <div style={{ lineHeight: 1.2 }}>Tertiary Commodity</div>
                  </Space>
                }
                style={{
                  backgroundColor: !tertiary ? "#f5f5f5" : "white",
                }}
                className="case-detail-child-card-wrapper"
              >
                <SecondaryForm
                  index={2}
                  indexLabel="Tertiary"
                  disabled={!tertiary || !enableEditCase}
                  disableAreaSizeUnitField={disableAreaSizeTertiaryField}
                  disableLandUnitField={disableTertiaryLandUnitField}
                />
              </Card>
            </Col>
            <Col span={24}>
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
                    {enableEditCase && (
                      <Button
                        htmlType="submit"
                        className="button button-submit button-secondary"
                        loading={isSaving}
                        onClick={() => setIsNextButton(false)}
                      >
                        Save
                      </Button>
                    )}
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
        </Card>
      </Form>
      {/* Support add User Access */}
      <Modal
        title="Share Case Access to Users"
        open={showModal}
        onCancel={() => setShowModal(false)}
        width={650}
        footer={false}
      >
        <Row gutter={[16, 16]} align="center">
          <Col span={12}>
            <DebounceSelect
              placeholder="Search for a user"
              value={selectedUser}
              fetchOptions={fetchUsers}
              onChange={(value) => setSelectedUser(value)}
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
              onChange={setSelectedPermission}
            />
          </Col>
          <Col span={4} align="end" style={{ float: "right" }}>
            <Button
              onClick={() => handleOnClickAddUserCaseAccess()}
              disabled={!selectedUser || !selectedPermission}
              loading={loadingUserCase}
            >
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
              dataIndex: "label",
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
          loading={loadingUserCase}
        />
      </Modal>
    </>
  );
};

export default CaseProfile;
