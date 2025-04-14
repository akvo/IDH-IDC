import uniq from "lodash/uniq";
import {
  commodities,
  disableLandUnitFieldForCommodityTypes,
  disableIncomeDriversFieldForCommodityTypes,
} from "../store/static";
import { Tag } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

export const flatten = (data, parent = null) => {
  let flatData = [];
  for (const item of data) {
    const flatItem = { ...item };
    flatItem.parent_id = parent ? parent.id : null;
    flatData.push(flatItem);

    if (item.childrens && item.childrens.length > 0) {
      flatData = flatData.concat(flatten(item.childrens, item));
    }
  }
  return flatData;
};

export const selectProps = {
  showSearch: true,
  allowClear: true,
  optionFilterProp: "label",
  style: {
    width: "100%",
  },
};

export const regexQuestionId = /#(\d+)/;

export const determineDecimalRound = (value) => (value % 1 === 0 ? 0 : 2);

export const getFunctionDefaultValue = (question, prefix, values = []) => {
  const function_name = question?.default_value?.split(" ");
  if (!function_name) {
    return 0;
  }
  const getFunction = function_name.reduce((acc, fn) => {
    const questionValue = fn.match(regexQuestionId);
    if (questionValue) {
      const valueName = `${prefix}-${questionValue[1]}`;
      const value = values.find((v) => v.id === valueName)?.value;
      if (!value) {
        acc.push(0);
        return acc;
      }
      acc.push(value.toString());
    } else {
      acc.push(fn);
    }
    return acc;
  }, []);
  const finalFunction = getFunction.join("");
  return eval(finalFunction);
};

export const generateSegmentPayloads = (
  values,
  currentCaseId,
  commodityList
) => {
  // generate segment payloads
  const segmentPayloads = values.map((fv) => {
    let res = {
      case: currentCaseId,
      region: fv.region,
      name: fv.label,
      target: fv?.target || null,
      adult: fv?.adult || null,
      child: fv?.child || null,
    };
    if (fv?.currentSegmentId) {
      res = {
        ...res,
        id: fv.currentSegmentId,
      };
    }
    // generate segment answer payloads
    let segmentAnswerPayloads = [];
    const questionIDs = uniq(
      Object.keys(fv.answers).map((key) => {
        const splitted = key.split("-");
        return parseInt(splitted[2]);
      })
    );
    commodityList.forEach((cl) => {
      const case_commodity = cl.case_commodity;
      questionIDs.forEach((qid) => {
        const fieldKey = `${case_commodity}-${qid}`;
        const currentValue = fv.answers[`current-${fieldKey}`];
        const feasibleValue = fv.answers[`feasible-${fieldKey}`];
        const answerTmp = {
          case_commodity: case_commodity,
          question: qid,
          current_value: currentValue,
          feasible_value: feasibleValue,
        };
        segmentAnswerPayloads.push(answerTmp);
      });
    });
    segmentAnswerPayloads = segmentAnswerPayloads.filter(
      (x) => x.current_value || x.feasible_value
    );
    if (segmentAnswerPayloads.length) {
      res = {
        ...res,
        answers: segmentAnswerPayloads,
      };
    }
    return res;
  });
  return segmentPayloads;
};

export const InputNumberThousandFormatter = {
  formatter: (value, _, round = false) => {
    if (round) {
      value = Math.round(parseFloat(value));
    }

    // Convert value to a string and split into integer and decimal parts
    const [integerPart, decimalPart] = `${value}`.split(".");

    // Format the integer part with commas
    const formattedIntegerPart = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );

    // Combine the formatted integer part with the decimal part, if it exists
    return typeof decimalPart !== "undefined"
      ? `${formattedIntegerPart}.${decimalPart}`
      : formattedIntegerPart;
  },
  parser: (value) => value.replace(/\$\s?|(,*)/g, ""),
};

export const removeUndefinedObjectValue = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (typeof value !== "undefined") {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const getFieldDisableStatusForCommodity = (commodity) => {
  const findCommodityCategory = commodities
    .find((c) => c.id === commodity)
    ?.category?.toLowerCase();
  const disableLandUnitField = disableLandUnitFieldForCommodityTypes.includes(
    findCommodityCategory
  )
    ? true
    : false;
  const disableDataOnIncomeDriverField =
    disableIncomeDriversFieldForCommodityTypes.includes(findCommodityCategory)
      ? true
      : false;
  return { disableLandUnitField, disableDataOnIncomeDriverField };
};

export const calculateIncomePercentage = ({ current, feasible }) => {
  if (current && feasible) {
    const percent = (feasible / current - 1) * 100;
    return {
      type: percent === 0 ? "default" : percent > 0 ? "increase" : "decrease",
      value: percent,
    };
  }
  return {
    type: "default",
    value: 0,
  };
};

export const renderPercentageTag = (type = "default", value = 0) => {
  value = value % 1 !== 0 || value === 0 ? value.toFixed(0) : value;
  value = `${value}%`;

  switch (type) {
    case "increase":
      return (
        <Tag color="success" icon={<ArrowUpOutlined />}>
          {value}
        </Tag>
      );
    case "decrease":
      return (
        <Tag color="error" icon={<ArrowDownOutlined />}>
          {value}
        </Tag>
      );

    default:
      return <Tag color="default">{value}</Tag>;
  }
};

export const calculateHouseholdSize = ({ adult = 0, child = 0 }) => {
  // OECD average household size
  // first adult = 1, next adult 0.5
  // 1 child = 0.3
  if (adult <= 0) {
    return child * 0.3;
  }
  const adult_size = adult === 1 ? 1 : 1 + (adult - 1) * 0.5;
  const children_size = child * 0.3;
  return adult_size + children_size;
};

export const roundToDecimal = (value, decimal = 1) => {
  const factor = Math.pow(10, decimal);
  const rounded = Math.round(value * factor) / factor;
  return parseFloat(rounded.toString()); // auto remove trailing zeros
};

export { default as api } from "./api";
