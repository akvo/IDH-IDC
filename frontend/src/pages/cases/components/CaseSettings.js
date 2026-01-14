import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, message, Drawer, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
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
import { isEqual, isEmpty, orderBy } from "lodash";
import { UserState } from "../../../store";
import { countryOptions, focusCommodityOptions } from "../../../store/static";
import { CustomEvent } from "@piwikpro/react-piwik-pro";
import { routePath } from "../../../components/route";
import { MAX_SEGMENT } from ".";

const dataUploadFieldPreffix = "data_upload_";

const CaseSettings = ({ open = false, handleCancel = () => {} }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const prevCase = PrevCaseState.useState((s) => s);
  const currentCase = CurrentCaseState.useState((s) => s);
  const { secondary, tertiary, general } = CaseUIState.useState((s) => s);
  const { enableEditCase, activeSegmentId } = general;

  const [prevCaseSettingValue, setPrevCaseSettingValue] = useState({});
  const [formData, setFormData] = useState({ segments: [""] });
  const [isSaving, setIsSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const { internal_user: userInternal } = UserState.useState((s) => s);

  const [deletedSegmentIds, setDeletedSegmentIds] = useState([]);
  const segmentFields = Form.useWatch("segments", form);

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

  const setNewCpiModalVisible = (value) => {
    CaseUIState.update((s) => ({
      ...s,
      stepSetIncomeTarget: {
        ...s.stepSetIncomeTarget,
        newCpiModalVisible: value,
      },
    }));
  };

  const setNewCPIState = ({ newCPI, newCPIFactor }) => {
    CaseUIState.update((s) => ({
      ...s,
      stepSetIncomeTarget: {
        ...s.stepSetIncomeTarget,
        newCPI,
        newCPIFactor,
      },
    }));
  };

  const isOnStep1Page = useMemo(() => {
    return window.location.pathname?.includes(stepPath.step1.label);
  }, []);

  useEffect(
    () => {
      setPrevCaseSettingValue(formData);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (currentCase?.id || !currentCase?.id) {
      form.resetFields();
      setFormData({ segments: [""] });
    }
  }, [currentCase?.id, form]);

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
          ? orderBy(
              currentCase.segments.map((s) => ({
                id: s.id,
                name: s.name,
                number_of_farmers: s.number_of_farmers,
              })),
              ["id"]
            )
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
  }, [currentCase, updateCaseUI, form]);

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

  const saveCaseSettings = (values, deleteSegment = false) => {
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
      import_id: values?.import_id || null,
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

    const isNewCase = isEmpty(currentCase?.id);
    const apiCall = currentCase.id
      ? api.put(`case/${currentCase.id}?updated=${isUpdated}`, payload)
      : api.post("case", payload);

    apiCall
      .then((res) => {
        // track event: external user create new case (PoC)
        if (!userInternal && isNewCase) {
          const reportedCountry = countryOptions.find(
            (co) => co.value === data.country
          );
          const reportedCommodity = focusCommodityOptions.find(
            (fc) => fc.value === data.focus_commodity
          );
          CustomEvent.trackEvent(
            "Case Overview",
            "Create new case",
            "External users Country wise",
            1,
            {
              dimension3: reportedCountry
                ? reportedCountry.label
                : data.country,
            }
          );
          CustomEvent.trackEvent(
            "Case Overview",
            "Create new case",
            "External users Commodity wise",
            1,
            {
              dimension4: reportedCommodity
                ? reportedCommodity.label
                : data.focus_commodity,
            }
          );
        }
        // EOL track event

        setPrevCaseSettingValue(filteredCurrentValue);
        let data = res?.data || {};
        data = {
          ...data,
          segments: data?.segments?.length
            ? orderBy(data.segments, ["id"])
            : [],
        };

        const lowestSegmentId = data?.segments?.[0]?.id;
        const newActiveSegmentId = deleteSegment
          ? lowestSegmentId
          : activeSegmentId
          ? activeSegmentId
          : lowestSegmentId;

        const activeSegment = data?.segments?.find(
          (s) => s.id === newActiveSegmentId
        );
        const benchmark = activeSegment?.benchmark || {};

        let updatedData = { ...data };
        // update segment region value
        // this handle when the segment value not saved yet to DB
        // but the Case Settings is updated, so we use the currectCase state value
        updatedData = {
          ...updatedData,
          segments: updatedData?.segments?.map((segment) => {
            const findCurrentSegment = currentCase?.segments?.find(
              (s) => s.id === segment.id
            );
            if (findCurrentSegment) {
              return {
                ...segment,
                child: findCurrentSegment?.child || null,
                adult: findCurrentSegment?.adult || null,
                region: findCurrentSegment?.region || null,
                target: findCurrentSegment?.target || 0,
              };
            }
            return segment;
          }),
        };
        // EOL update segment region value

        // handle when year / country/ currency updated
        const {
          year: prevYear,
          country: prevCountry,
          currency: prevCurrency,
        } = prevCase;
        const {
          year: currYear,
          country: currCountry,
          currency: currCurrency,
        } = data;
        if (prevCountry !== currCountry) {
          updatedData = {
            ...updatedData,
            segments: updatedData?.segments?.map((segment) => {
              return {
                ...segment,
                child: null,
                adult: null,
                region: null,
                target: null,
                benchmark: null,
              };
            }),
          };
        }
        if (prevYear !== currYear || prevCurrency !== currCurrency) {
          updatedData = {
            ...updatedData,
            segments: updatedData?.segments?.map((segment) => {
              return {
                ...segment,
                target: null,
                benchmark: null,
              };
            }),
          };
        }
        // EOL handle when year / country / currency updated

        // handle trigger new CPI adjustment modal
        // show when cpi_factor = null
        if (isOnStep1Page) {
          const benchmarkValue =
            benchmark?.value?.[data?.currency?.toLowerCase()] ||
            benchmark?.value?.lcu;
          if (
            benchmarkValue &&
            benchmark?.cpi_factor === null &&
            benchmark?.year !== data.year
          ) {
            updatedData = {
              ...data,
              segments: data?.segments?.map((segment) => {
                if (segment.id === newActiveSegmentId) {
                  return {
                    ...segment,
                    target: 0,
                  };
                }
                return segment;
              }),
            };
            setNewCpiModalVisible(true);
            setNewCPIState({ newCPI: null, newCPIFactor: null });
          } else {
            setNewCpiModalVisible(false);
          }
        }
        // EOL handle trigger new CPI adjustment modal

        // update global state
        CurrentCaseState.update((s) => ({
          ...s,
          ...updatedData,
        }));
        PrevCaseState.update((s) => ({
          ...s,
          ...data,
        }));
        updateCaseUI("general", {
          ...general,
          activeSegmentId: newActiveSegmentId,
        });
        // EOL update global state

        messageApi.open({
          type: "success",
          content: "Case setting saved successfully.",
        });

        // SAVE /case-import/generate-segment-values
        if (values?.import_id) {
          const confirmedSegPayload = {
            case_id: data.id,
            import_id: values.import_id,
            segmentation_variable: values.data_upload_segmentation_variable,
            segments: values.segments.map((seg) => {
              // find segment id from data.segments
              const findSegment = data.segments.find(
                (s) => s.name === seg.name
              );
              return {
                id: findSegment ? findSegment.id : null,
                index: seg.index,
                name: seg.name,
                value: seg.value || 0,
              };
            }),
          };
          api
            .post("case-import/generate-segment-values", confirmedSegPayload)
            .then(() => {
              // reset form and close drawer
              setTimeout(() => {
                form.resetFields();
                handleCancel();
                // always navigate to step 1 after save
                navigate(
                  `${routePath.idc.case}/${data.id}/${stepPath.step1.label}`
                );
              }, 100);
            })
            .catch((e) => {
              console.error(e);
              messageApi.open({
                type: "error",
                content: "Failed to generate segment values from import data.",
              });
            });
        } else {
          // NORMAL BEHAVIOUR
          setTimeout(() => {
            form.resetFields();
            handleCancel();
            // always navigate to step 1 after save
            navigate(
              `${routePath.idc.case}/${data.id}/${stepPath.step1.label}`
            );
          }, 100);
        }
        // EOL SAVE /case-import/generate-segment-values
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

  const onFinish = (values) => {
    setIsSaving(true);
    setFormData(values);

    // handle if any segments deleted
    if (deletedSegmentIds?.length) {
      Promise.all(deletedSegmentIds.map((sId) => api.delete(`segment/${sId}`)))
        .then(() => {
          setDeletedSegmentIds([]);
          setTimeout(() => {
            saveCaseSettings(values, true);
          }, 100);
        })
        .catch((e) => {
          console.error(e);
          messageApi.open({
            type: "error",
            content: "Failed to delete segments.",
          });
        });
    } else {
      saveCaseSettings(values);
    }
  };

  return (
    <Drawer
      title="Create new case"
      closable={false}
      onClose={handleCancel}
      open={open}
      width="60%"
      className="case-settings-modal-container"
      maskClosable={false}
      extra={<Button icon={<CloseOutlined />} onClick={handleCancel} />}
    >
      {contextHolder}
      <Form
        form={form}
        name="case-settings-form"
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
          deletedSegmentIds={deletedSegmentIds}
          setDeletedSegmentIds={setDeletedSegmentIds}
          dataUploadFieldPreffix={dataUploadFieldPreffix}
        />
        <div className="case-form-button-wrapper">
          <Button
            onClick={() => {
              // reset deleted segment on cancel
              if (deletedSegmentIds?.length) {
                form.setFieldValue("segments", formData.segments);
              }
              handleCancel();
            }}
            className="button-cancel"
          >
            Cancel
          </Button>
          <Button
            loading={isSaving}
            disabled={!enableEditCase || segmentFields?.length === MAX_SEGMENT}
            className="button-save"
            onClick={() => form.submit()}
          >
            Save case
          </Button>
        </div>
      </Form>
    </Drawer>
  );
};

export default CaseSettings;
