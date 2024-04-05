import uniq from "lodash/uniq";
import { Col, Space } from "antd";

const commodityCategories = window.master?.commodity_categories || [];
export const commodities = commodityCategories
  ? commodityCategories.reduce(
      (acc, category) => [
        ...acc,
        ...category.commodities.map((c) => ({
          ...c,
          category: category.name.toLowerCase(),
        })),
      ],
      []
    )
  : [];

// create focus/primary commodities without livestock
export const focusCommodityOptions = commodities
  .filter((c) => c.category.toLowerCase() !== "livestock")
  .map((commodity) => ({
    label: commodity.name,
    value: commodity.id,
  }));

export const commodityOptions = commodities.map((commodity) => ({
  label: commodity.name,
  value: commodity.id,
}));

export const currencyOptions = window.master?.currencies || [];
export const countryOptions = window.master?.countries || [];

export const yesNoOptions = [
  {
    label: "Yes",
    value: 1,
  },
  {
    label: "No",
    value: 0,
  },
];

export const tagOptions = [
  {
    label: "Smallholder",
    value: "smallholder",
  },
  {
    label: "Large Scale",
    value: "large-scale",
  },
  {
    label: "Plantation",
    value: "plantation",
  },
  {
    label: "Processing",
    value: "processing",
  },
  {
    label: "Trading",
    value: "trading",
  },
  {
    label: "Retail",
    value: "retail",
  },
  {
    label: "Other",
    value: "other",
  },
];

export const reportingPeriod = [
  {
    label: "Per Season",
    value: "per-season",
  },
  {
    label: "Per Year",
    value: "per-year",
  },
];

export const selectProps = {
  showSearch: true,
  allowClear: true,
  optionFilterProp: "label",
  style: {
    width: "100%",
  },
};

export const indentSize = 37.5;

export const regexQuestionId = /#(\d+)/;

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
    const res =
      value >= 1000
        ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        : value && value % 1 !== 0
        ? parseFloat(value)
        : value;
    return res;
  },
  parser: (value) => value.replace(/\$\s?|(,*)/g, ""),
};

export const customFormula = {
  revenue_focus_commodity: "#2 * #3 * #4",
  focus_commodity_cost_of_production:
    "( ( #5 * #2 ) + ( #26 * #3 * #2 ) ) * -1",
};

/**
 * NOTE
 * Focus Income formula ( ( #2 * #3 * #4 ) + ( #40 * #41 * #42 ) ) - ( ( #5 * #2 ) + ( #26 * #3 * #2 ) + ( #43 * #40 ) )
 * Target = 9001,
 * Diversified = 9002
 */
export const yAxisFormula = {
  "#2": "( #9001 - #9002 + ( ( #5 * #2 ) + ( #26 * #3 * #2 ) + ( #43 * #40 ) ) )  / ( ( #4 * #3 ) + ( #42 * #41 ) )", // area
  "#3": "( #9001 - #9002 + ( ( #5 * #2 ) + ( #26 * #3 * #2 ) + ( #43 * #40 ) ) ) / ( ( #4 * #2 ) + ( #42 * #40 ) )", // volume
  "#4": "( #9001 - #9002 + ( ( #5 * #2 ) + ( #26 * #3 * #2 ) + ( #43 * #40 ) ) ) / ( ( #3 * #2 ) + ( #41 * #40 ) )", // price
  "#5": "( ( #9001 - #9002 ) - ( ( #2 * #4 * #3 ) + ( #40 * #42 * #41 ) ) ) / ( #2 + #40 )", // CoP for crop
  "#26":
    "( ( #9001 - #9002 ) - ( ( #2 * #4 * #3 ) + ( #40 * #42 * #41 ) ) ) / ( ( #3 * #2 ) + ( #41 * #40 ) )", // CoP for aqua
  "#9002":
    "( #9001 + ( ( #5 * #2 ) + ( #26 * #3 * #2 ) + ( #43 * #40 ) ) ) - ( ( #2 * #4 * #3 ) + ( #40 * #42 * #41 ) )", // diversified
  "#40":
    "( #9001 - #9002 + ( ( #5 * #2 ) + ( #26 * #3 * #2 ) + ( #43 * #40 ) ) )  / ( ( #4 * #3 ) + ( #42 * #41 ) )", // animals
  "#41":
    "( #9001 - #9002 + ( ( #5 * #2 ) + ( #26 * #3 * #2 ) + ( #43 * #40 ) ) ) / ( ( #4 * #2 ) + ( #42 * #40 ) )", // volume for animals
  "#42":
    "( #9001 - #9002 + ( ( #5 * #2 ) + ( #26 * #3 * #2 ) + ( #43 * #40 ) ) ) / ( ( #3 * #2 ) + ( #41 * #40 ) )", // price for animals
  "#43":
    "( ( #9001 - #9002 ) - ( ( #2 * #4 * #3 ) + ( #40 * #42 * #41 ) ) ) / ( #2 + #40 )", // CoP for animals
};

export const removeUndefinedObjectValue = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (typeof value !== "undefined") {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const diversifiedIncomeTooltipText =
  "The majority of farmer households also earn an income from other sources than the primary commodity. This can be income from other crops, livestock, income earned from off-farm labour or non-farm non labour sources (e.g. remittances, government transfers).";

export const Step = ({
  number,
  title,
  description = null,
  titleStyle = {},
}) => (
  <Col span={24}>
    <Space align="center" className="scenario-step-wrapper">
      {number && <div className="number">{number}</div>}
      <div className="title" style={titleStyle}>
        {title}
      </div>
    </Space>
    {description && (
      <div className="scenario-step-description">{description}</div>
    )}
  </Col>
);

export { default as AreaUnitFields } from "./AreaUnitFields";
export { default as SideMenu } from "./SideMenu";
export { default as CaseProfile } from "./CaseProfile";
export { default as DataFields } from "./DataFields";
export { default as IncomeDriverDataEntry } from "./IncomeDriverDataEntry";
export { default as IncomeDriverForm } from "./IncomeDriverForm";
export { default as IncomeDriverTarget } from "./IncomeDriverTarget";
export { default as IncomeDriverDashboard } from "./IncomeDriverDashboard";
export { default as DashboardIncomeOverview } from "./DashboardIncomeOverview";
export { default as DashboardSensitivityAnalysis } from "./DashboardSensitivityAnalysis";
export { default as DashboardScenarioModeling } from "./DashboardScenarioModeling";
export { default as Questions } from "./Questions";
export { default as Scenario } from "./Scenario";
export { default as DebounceSelect } from "./DebounceSelect";
