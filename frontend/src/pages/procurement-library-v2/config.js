import { Space } from "antd";
import {
  CheckClipBoardIcon,
  GearIcon,
  SearchBoldIcon,
  UserSupportIcon,
} from "../../lib/icon";
import InternalAnalysisIcon from "../../assets/icons/procurement-library/internal-analysis.png";
import ExternalAnalysisIcon from "../../assets/icons/procurement-library/external-analysis.png";
import StrategicChoicesIcon from "../../assets/icons/procurement-library/strategic-choices.png";
import ImplementationIcon from "../../assets/icons/procurement-library/implementation.png";
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

export const PROCUREMENT_CATEGORIES_ID = {
  sourcing_strategy_cycle: 1,
  procurement_principles: 2,
};

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
  <Space align="top">
    <img
      src={CheckIconSvg}
      alt="check-icon"
      className="li-icon"
      style={{ marginTop: -2 }}
    />
    {text}
  </Space>
);
export const SOURCING_STRATEGY_CYCLE_TABS = [
  {
    key: 1,
    step: "Step 1",
    label: "Internal analysis",
    content: {
      icon: InternalAnalysisIcon,
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
          children: (
            <ul>
              <li>
                <CheckIconItem text="R&D" />
              </li>
              <li>
                <CheckIconItem text="Finance" />
              </li>
              <li>
                <CheckIconItem text="Marketing/Brand" />
              </li>
              <li>
                <CheckIconItem text="External Affairs" />
              </li>
            </ul>
          ),
        },
        {
          key: 3,
          label: <b>Sustainability Integration</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Review sustainability strategy, with a view to targets, commitments and policies relevant to current procurement strategy development. This may include deforestation policies, Scope 3 decarbonisation commitments, human rights due diligence processes, living wage or income commitments etc." />
              </li>
              <li>
                <CheckIconItem text="Engage CSO / Sustainability team" />
              </li>
            </ul>
          ),
        },
        {
          key: 4,
          label: <b>Practice Interventions</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Incorporate Business Strategy Needs" />
              </li>
              <li>
                <CheckIconItem text="Value Chain Visibility" />
              </li>
            </ul>
          ),
        },
      ],
    },
  },
  {
    key: 2,
    step: "Step 2",
    label: "External analysis",
    content: {
      icon: ExternalAnalysisIcon,
      title: "External Analysis",
      description:
        "Review and research external customer, market and industry trends - including risks and opportunities, supplier pool and any relevant competitor insights",
      collapseItems: [
        {
          key: 1,
          label: <b>Activities</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Supply market research and trends" />
              </li>
              <li>
                <CheckIconItem text="Identifying key suppliers" />
              </li>
              <li>
                <CheckIconItem text="Identifying commercial market constraints e.g. duties, protectionism" />
              </li>
              <li>
                <CheckIconItem text="Understanding the geopolitical landscape and potential impacts" />
              </li>
            </ul>
          ),
        },
        {
          key: 2,
          label: <b>Stakeholders</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="R&D" />
              </li>
              <li>
                <CheckIconItem text="Finance" />
              </li>
              <li>
                <CheckIconItem text="Marketing/Brand" />
              </li>
              <li>
                <CheckIconItem text="External Affairs" />
              </li>
            </ul>
          ),
        },
        {
          key: 3,
          label: <b>Sustainability Integration</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Understanding sustainability impact risks along the value chain and at origin e.g. carbon emissions, deforestation, water scarcity, human rights etc" />
              </li>
              <li>
                <CheckIconItem text="Understanding sustainability-linked regulatory requirements e.g. due diligence requirements, traceability and ethical requirements, supplier data gathering and disclosure requirements" />
              </li>
              <li>
                <CheckIconItem text="Supplier sustainability capability assessment" />
              </li>
              <li>
                <CheckIconItem text="Customer and/or consumer sustainability requirements and implications for sourcing decisions" />
              </li>
              <li>
                <CheckIconItem text="Engaging CSO/Sustainability team" />
              </li>
            </ul>
          ),
        },
        {
          key: 4,
          label: <b>Practice Interventions</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Comprehensive Value Chain Risk Assessment" />
              </li>
              <li>
                <CheckIconItem text="Supplier Sustainability Assessment" />
              </li>
              <li>
                <CheckIconItem text="Supplier Segmentation" />
              </li>
            </ul>
          ),
        },
      ],
    },
  },
  {
    key: 3,
    step: "Step 3",
    label: "Strategic choices",
    content: {
      icon: StrategicChoicesIcon,
      title: "Strategic Choices",
      description:
        "Drawing on insights from internal and external analysis, generate strategic sourcing options, rigorously stress-test them against factors such as cost, risk and market dynamics, and select the most viable choices to take forward for execution.",
      collapseItems: [
        {
          key: 1,
          label: <b>Activities</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Decide supplier approach - single vs. multiple suppliers; long-term contracts vs. one-off / spot buying" />
              </li>
              <li>
                <CheckIconItem text="Evaluate and select supplier(s)" />
              </li>
              <li>
                <CheckIconItem text="Negotiate contracts based on costs, risk mitigation and partnership value" />
              </li>
            </ul>
          ),
        },
        {
          key: 2,
          label: <b>Stakeholders</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Finance" />
              </li>
              <li>
                <CheckIconItem text="Legal" />
              </li>
              <li>
                <CheckIconItem text="Social Compliance team" />
              </li>
              <li>
                <CheckIconItem text="CPO" />
              </li>
            </ul>
          ),
        },
        {
          key: 3,
          label: <b>Sustainability Integration</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Understand how choices mitigate or increase identified sustainability risks" />
              </li>
              <li>
                <CheckIconItem text="Use an end-to-end Total Cost of Ownership lens to inform choices" />
              </li>
              <li>
                <CheckIconItem text="Engage with CSO / Sustainability teams" />
              </li>
            </ul>
          ),
        },
        {
          key: 4,
          label: <b>Practice Interventions</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Long-term Contracts" />
              </li>
              <li>
                <CheckIconItem text="Procurement-Driven Sustainability Investments" />
              </li>
              <li>
                <CheckIconItem text="Supplier Capacity Building" />
              </li>
              <li>
                <CheckIconItem text="Reducing Upstream Supplier Tiers" />
              </li>
              <li>
                <CheckIconItem text="Direct Farmer Contracting" />
              </li>
              <li>
                <CheckIconItem text="Mutual Supplier-Based Incentives" />
              </li>
              <li>
                <CheckIconItem text="Selecting a Sustainability Certification" />
              </li>
              <li>
                <CheckIconItem text="Smallholder Crop Production" />
              </li>
              <li>
                <CheckIconItem text="Regenerative Agriculture" />
              </li>
              <li>
                <CheckIconItem text="Decarbonisation Levers" />
              </li>
              <li>
                <CheckIconItem text="Precision Agriculture" />
              </li>
              <li>
                <CheckIconItem text="Sustainable Water Management" />
              </li>
            </ul>
          ),
        },
      ],
    },
  },
  {
    key: 4,
    step: "Step 4",
    label: "Implementation",
    content: {
      icon: ImplementationIcon,
      title: "Implementation",
      description:
        "Turn the sourcing strategy into a practical roadmap to ensure it is delivered, tracked and improved over time",
      collapseItems: [
        {
          key: 1,
          label: <b>Activities</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Strategy sign-off by critical senior stakeholders" />
              </li>
              <li>
                <CheckIconItem text="Establishing governance structure to support implementation" />
              </li>
              <li>
                <CheckIconItem text="Development of KPIs to track progress and deployment of platform(s), tool(s) and documentation to record data against KPIs" />
              </li>
              <li>
                <CheckIconItem text="Onboarding suppliers" />
              </li>
              <li>
                <CheckIconItem text="Defining roles, responsibilities, timelines for implementing the sourcing strategy" />
              </li>
              <li>
                <CheckIconItem text="Establishing Supplier Relationship Management (SRM) processes" />
              </li>
              <li>
                <CheckIconItem text="Launching procurement activities" />
              </li>
              <li>
                <CheckIconItem text="Monitoring, reviewing and assessing performance against KPIs, capturing insights and adjusting strategies as needed" />
              </li>
            </ul>
          ),
        },
        {
          key: 2,
          label: <b>Stakeholders</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Exec Team" />
              </li>
              <li>
                <CheckIconItem text="Finance" />
              </li>
              <li>
                <CheckIconItem text="Social Compliance team" />
              </li>
              <li>
                <CheckIconItem text="CPO" />
              </li>
            </ul>
          ),
        },
        {
          key: 3,
          label: <b>Sustainability Integration</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Ensure governance, KPIs, and clear SRM structures are in place for sustainability-related goals - both social and environmental" />
              </li>
              <li>
                <CheckIconItem text="Focus on excellent SRM as a cost-effective strategy to invest in sustainability e.g. prevents cost of regulatory non-compliance; creates value through maintenance of quality standards, etc." />
              </li>
              <li>
                <CheckIconItem text="Engage CSO / Sustainability team" />
              </li>
            </ul>
          ),
        },
        {
          key: 4,
          label: <b>Practice Interventions</b>,
          children: (
            <ul>
              <li>
                <CheckIconItem text="Data Procurement: KPIs that go beyond spend" />
              </li>
              <li>
                <CheckIconItem text="Fair Pricing and Flexible Payment Terms" />
              </li>
              <li>
                <CheckIconItem text="Buyer Sustainability Targets" />
              </li>
              <li>
                <CheckIconItem text="Direct and Indirect Pre-Finance" />
              </li>
              <li>
                <CheckIconItem text="Group Certification Programmes" />
              </li>
              <li>
                <CheckIconItem text="Integrated Pest Management" />
              </li>
              <li>
                <CheckIconItem text="Soil Conservation" />
              </li>
              <li>
                <CheckIconItem text="Fair Trade or Organic Certification" />
              </li>
              <li>
                <CheckIconItem text="Crop Rotation and Diversification" />
              </li>
              <li>
                <CheckIconItem text="Agroecological Practices" />
              </li>
            </ul>
          ),
        },
      ],
    },
  },
];

export const SOURCING_STRATEGY_CYCLE_TOOLTIPS = [
  {
    title: "Step 1 - Internal Analysis",
    description:
      "Complete analysis and understanding of the internal landscape and needs, along with current and future trends.",
    className: "internal-analysis",
    placement: "top",
  },
  {
    title: "Step 2 - External Analysis",
    description:
      "Complete analysis and understanding of external landscape and current situation",
    className: "external-analysis",
    placement: "right",
  },
  {
    title: "Step 3 - Strategic Choices",
    description:
      "Make strategic choices which will direct the development of the sourcing strategy",
    className: "strategic-choices",
    placement: "bottom",
  },
  {
    title: "Step 4 - Implementation",
    description:
      "Develop detailed plans to execute, monitor and assess the strategy",
    className: "implementation",
    placement: "left",
  },
];

export const TOTAL_COST_OF_OWNERSHIP_CHART_TEXT_CONTENT = [
  "Blind spots on risks beyond price - e.g. human rights abuses, poverty among smallholder farmers or biodiversity and nature loss through deforestation - all of which can lead to supply shortages, legal penalties or reputational damage and pressure from customers.",
  "Weaker supplier relationships - missing out on value creation opportunities and innovation as suppliers do not view the buyer as a strategic partner.",
  "The visual provides a high-level example of how strategically integrating and investing in sustainability in sourcing can result in lower costs overall when considering the value chain holistically.",
];
