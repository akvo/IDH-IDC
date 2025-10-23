import { Space } from "antd";
import {
  CheckClipBoardIcon,
  GearIcon,
  SearchBoldIcon,
  UserSupportIcon,
} from "../../lib/icon";
import LupIcon from "../../assets/icons/procurement-library/lup.svg";
import CheckIconSvg from "../../assets/icons/procurement-library/check.svg";

export const LIMIT_RESULT = 15;

export const PROCUREMENT_PROCESS_COLORS = [
  "#FFC0CB", // pink
  "#FF0000", // red
  "#FFFF00", // yellow
  "#FFA500", // orange
  "#00FFFF", // cyan
  "#008000", // green
  "#0000FF", // blue
  "#800080", // purple
  "#1C39BB", // geekblue
  "#FF00FF", // magenta
  "#FF4500", // volcano
  "#FFD700", // gold
  "#00FF00", // lime
  "#556B2F", // dark olive green
  "#8B008B", // dark magenta
  "#483D8B", // dark slate blue
  "#2E8B57", // sea green
  "#4B0082", // indigo
  "#191970", // midnight blue
  "#000080", // navy
  "#808000", // olive
  "#800000", // maroon
  "#008080", // teal
];

export const PROCUREMENT_IMPACT_AREAS = {
  income: "income_impact",
  env: "environmental_impact",
};

export const PROCUREMENT_TABS = [
  {
    key: "farmer_rationale",
    label: "Farmer Rationale",
  },
  {
    key: "business_rationale",
    label: "Business Rationale",
  },
  {
    key: "enabling_conditions",
    label: "Enabling Conditions",
  },
  {
    key: "risks_n_trade_offs",
    label: "Risks and Trade-offs",
  },
  // {
  //   key: "source_or_evidence",
  //   label: "Source or Evidence",
  // },
];

export const PROCUREMENT_SCALE = [
  {
    key: "implementation_time",
    label: "Implementation Time",
    reversed: true,
  },
  {
    key: "implementation_cost_/_effort",
    label: "Implementation Cost / Effort",
    reversed: true,
  },
  {
    key: "income_impact",
    label: "Income Impact",
    reversed: false,
  },
  {
    key: "environmental_impact",
    label: "Environmental Impact",
    reversed: false,
  },
];

export const PROCUREMENT_COLOR_SCALE = [
  "#FF010E",
  "#FF8754",
  "#FEC508",
  "#ABEA53",
  "#48D985",
];

export const IMPACT_AREA_OPTIONS = [
  {
    value: PROCUREMENT_IMPACT_AREAS.income,
    label: "Income",
  },
  {
    value: PROCUREMENT_IMPACT_AREAS.env,
    label: "Environment",
  },
];

// TODO :: TO DELETE
export const PROCUREMENT_KEY_FEATURES = [
  {
    id: 1,
    icon: <SearchBoldIcon />,
    title: "Self Assessment Tool",
    description:
      "The quick self-assessment allows users to evaluate their specific needs and identify the most relevant sustainable practices for their procurement processes. This feature makes it easier for stakeholders to receive tailored recommendations.",
  },
  {
    id: 2,
    title: "Comprehensive List of Practices",
    icon: <CheckClipBoardIcon />,
    description:
      "The intervention library offers a wide range of sustainable procurement practices, each with detailed information such as definitions, rationale for intervention, and enabling conditions. This allows users to thoroughly understand how each practice contributes to sustainability.",
  },
  {
    id: 3,
    title: "Filters for Easy Browsing",
    icon: <GearIcon />,
    description:
      "For users who prefer to explore the entire library, the filters help narrow down the options according to various criteria. This enables users to find the best practices that fit their particular situation or organisational context.",
  },
  {
    id: 4,
    title: "Support for Stakeholders",
    icon: <UserSupportIcon />,
    description:
      "Whether you are a procurement officer, sustainability manager, or policy maker, the library offers guidance to help you make more sustainable choices, ultimately contributing to the achievement of broader sustainability goals.",
  },
];
// EOL TODO

const CheckIconItem = ({ text }) => (
  <Space>
    <img src={CheckIconSvg} alt="check-icon" className="li-icon" />
    {text}
  </Space>
);
export const SOURCING_STRATEGY_CYCLE_TABS = [
  {
    key: 1,
    step: "Step 1",
    label: "Internal analysis",
    content: {
      icon: LupIcon,
      title: "Internal Analysis",
      description:
        "Define the specific business requirements, demand predictions and insights, and any existing sustainability considerations or goals.",
      collapseItems: [
        {
          key: 1,
          label: <b>Activities</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem
                  text="Review current business strategy, including any known or
                potential upcoming changes"
                />
              </li>
              <li>
                <CheckIconItem
                  text="Review existing category spend analysis and how business
                strategy may impact this"
                />
              </li>
            </ul>
          ),
        },
        {
          key: 2,
          label: <b>Stakeholders</b>,
          children: [],
        },
        {
          key: 3,
          label: <b>Sustainability Integration</b>,
          children: [],
        },
        {
          key: 4,
          label: <b>Practive Interventions</b>,
          children: [],
        },
      ],
    },
  },
  {
    key: 2,
    step: "Step 2",
    label: "External analysis",
    content: null,
  },
  {
    key: 3,
    step: "Step 3",
    label: "Strategic choices",
    content: null,
  },
  {
    key: 4,
    step: "Step 4",
    label: "Implementation",
    content: null,
  },
];
