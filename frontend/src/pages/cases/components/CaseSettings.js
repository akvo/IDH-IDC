import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Form, message } from "antd";
import { CaseForm } from ".";
import {
  removeUndefinedObjectValue,
  getFieldDisableStatusForCommodity,
  api,
} from "../../../lib";
import dayjs from "dayjs";
import {
  CaseUIState,
  CurrentCaseState,
  PrevCaseState,
  stepPath,
} from "../store";
import { isEqual } from "lodash";

const CaseSettings = ({ open = false, handleCancel = () => {} }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const currentCase = CurrentCaseState.useState((s) => s);
  const { secondary, tertiary, general } = CaseUIState.useState((s) => s);
  const { enableEditCase } = general;

  const [prevCaseSettingValue, setPrevCaseSettingValue] = useState({});
  const [formData, setFormData] = useState({ segments: [""] });
  const [isSaving, setIsSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const updateCurrentCase = useCallback((key, value) => {
    CurrentCaseState.update((s) => ({
      ...s,
      [key]: value,
    }));
  }, []);

  const updateCaseUI = useCallback((key, value) => {
    CaseUIState.update((s) => ({
      ...s,
      [key]: value,
    }));
  }, []);

  useEffect(
    () => {
      setPrevCaseSettingValue(formData);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    // handle initial load
    if (currentCase.id) {
      // focus commodity
      const focusCommodityValue = {
        name: currentCase.name,
        description: currentCase.description,
        private: currentCase?.private || false,
        tags: currentCase?.tags || [],
        country: currentCase.country,
        focus_commodity: currentCase.focus_commodity,
        year: dayjs(String(currentCase.year)),
        currency: currentCase.currency,
        area_size_unit: currentCase.area_size_unit,
        volume_measurement_unit: currentCase.volume_measurement_unit,
        reporting_period: currentCase.reporting_period,
        company: currentCase.company,
        segments: currentCase?.segments?.length
          ? currentCase.segments.map((s) => ({
              id: s.id,
              name: s.name,
              number_of_farmers: s.number_of_farmers,
            }))
          : [""],
      };
      // secondary
      let secondaryCommodityValue = {};
      const secondaryCommodityTmp = currentCase.case_commodities.find(
        (val) => val.commodity_type === "secondary"
      );
      if (secondaryCommodityTmp) {
        let disableAreaSizeField = true;
        Object.keys(secondaryCommodityTmp).forEach((key) => {
          let val = secondaryCommodityTmp[key];
          if (key === "breakdown") {
            val = val ? 1 : 0;
            disableAreaSizeField = val ? false : true;
          }
          secondaryCommodityValue = {
            ...secondaryCommodityValue,
            [`secondary-${key}`]: val,
          };
        });
        const { disableLandUnitField, disableDataOnIncomeDriverField } =
          getFieldDisableStatusForCommodity(secondaryCommodityTmp?.commodity);
        // update case UI state
        updateCaseUI("secondary", {
          enable: true,
          disableAreaSizeField: disableAreaSizeField,
          disableLandUnitField: disableLandUnitField,
          disableDataOnIncomeDriverField: disableDataOnIncomeDriverField,
        });
      }
      // tertiary
      let tertiaryCommodityValue = {};
      const tertiaryCommodityTmp = currentCase.case_commodities.find(
        (val) => val.commodity_type === "tertiary"
      );
      if (tertiaryCommodityTmp) {
        let disableAreaSizeField = true;
        Object.keys(tertiaryCommodityTmp).forEach((key) => {
          let val = tertiaryCommodityTmp[key];
          if (key === "breakdown") {
            val = val ? 1 : 0;
            disableAreaSizeField = val ? false : true;
          }
          tertiaryCommodityValue = {
            ...tertiaryCommodityValue,
            [`tertiary-${key}`]: val,
          };
        });
        const { disableLandUnitField, disableDataOnIncomeDriverField } =
          getFieldDisableStatusForCommodity(tertiaryCommodityTmp?.commodity);
        // update case UI state
        updateCaseUI("tertiary", {
          enable: true,
          disableAreaSizeField: disableAreaSizeField,
          disableLandUnitField: disableLandUnitField,
          disableDataOnIncomeDriverField: disableDataOnIncomeDriverField,
        });
      }
      // set initial value
      const formDataTmp = {
        ...focusCommodityValue,
        ...secondaryCommodityValue,
        ...tertiaryCommodityValue,
      };
      setFormData(formDataTmp);
    }
  }, [currentCase, updateCaseUI]);

  const onValuesChange = (changedValues) => {
    // secondary breakdown handle
    if (changedValues?.["secondary-breakdown"] === 0) {
      form.setFieldsValue({
        ["secondary-area_size_unit"]: null,
        ["secondary-volume_measurement_unit"]: null,
      });
    }
    // tertiary breakdown handle
    if (changedValues?.["tertiary-breakdown"] === 0) {
      form.setFieldsValue({
        ["tertiary-area_size_unit"]: null,
        ["tertiary-volume_measurement_unit"]: null,
      });
    }
  };

  const onFinish = (values) => {
    setIsSaving(true);
    setFormData(values);

    const other_commodities = [];

    if (secondary.enable) {
      // add secondary crop into case commodities
      const secondaryCommodityValue = {
        commodity: values["secondary-commodity"],
        breakdown: values["secondary-breakdown"] ? true : false,
        currency: values.currency,
        area_size_unit: values["secondary-area_size_unit"],
        volume_measurement_unit: values["secondary-volume_measurement_unit"],
        commodity_type: "secondary",
      };
      other_commodities.push(secondaryCommodityValue);
    }

    if (tertiary.enable) {
      // add tertiary crop into case commodities
      const tertiaryCommodityValue = {
        commodity: values["tertiary-commodity"],
        breakdown: values["tertiary-breakdown"] ? true : false,
        currency: values.currency,
        area_size_unit: values["tertiary-area_size_unit"],
        volume_measurement_unit: values["tertiary-volume_measurement_unit"],
        commodity_type: "tertiary",
      };
      other_commodities.push(tertiaryCommodityValue);
    }

    const payload = {
      name: values.name,
      description: values.description,
      country: values.country,
      focus_commodity: values.focus_commodity,
      year: dayjs(values.year).year(),
      currency: values.currency,
      area_size_unit: values.area_size_unit,
      volume_measurement_unit: values.volume_measurement_unit,
      multiple_commodities: secondary.enable || tertiary.enable,
      reporting_period: "per-year",
      cost_of_production_unit: "cost_of_production_unit",
      segmentation: true,
      living_income_study: null,
      logo: null,
      private: currentCase.private,
      tags: values.tags || null,
      company: values.company || null,
      other_commodities: other_commodities,
      segments: values.segments,
    };

    // detect is payload updated
    const filteredPrevValue = removeUndefinedObjectValue(prevCaseSettingValue);
    const filteredCurrentValue = {
      ...filteredPrevValue,
      ...removeUndefinedObjectValue(values),
      private: currentCase.private,
      reporting_period: "per-year",
    };
    const isUpdated = !isEqual(filteredPrevValue, filteredCurrentValue);
    // EOL detect is payload updated

    const apiCall = currentCase.id
      ? api.put(`case/${currentCase.id}?updated=${isUpdated}`, payload)
      : api.post("case", payload);

    apiCall
      .then((res) => {
        setPrevCaseSettingValue(filteredCurrentValue);
        const { data } = res;
        CurrentCaseState.update((s) => ({
          ...s,
          ...data,
        }));
        PrevCaseState.update((s) => ({
          ...s,
          ...data,
        }));
        messageApi.open({
          type: "success",
          content: "Case setting saved successfully.",
        });
        setTimeout(() => {
          form.resetFields();
          handleCancel();
          navigate(`/case/${data.id}/${stepPath.step1.label}`);
        }, 100);
      })
      .catch((e) => {
        console.error(e);
        const { status, data } = e.response;
        let errorText = "Failed to save case setting.";
        if (status === 403) {
          errorText = data.detail;
        }
        messageApi.open({
          type: "error",
          content: errorText,
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Modal
      title="Create new case"
      open={open}
      onOk={() => form.submit()}
      okButtonProps={{
        loading: isSaving,
        disabled: !enableEditCase,
      }}
      okText="Save case"
      onCancel={handleCancel}
      width="65%"
      className="case-settings-modal-container"
      maskClosable={false}
    >
      {contextHolder}
      <Form
        form={form}
        name="basic"
        layout="vertical"
        initialValues={formData}
        onValuesChange={onValuesChange}
        onFinish={onFinish}
        autoComplete="off"
      >
        <CaseForm
          form={form}
          enableEditCase={enableEditCase}
          updateCurrentCase={updateCurrentCase}
        />
      </Form>
    </Modal>
  );
};

export default CaseSettings;
