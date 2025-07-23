import IncomeMeasurementIcon from "../../assets/icons/home/income-measurement-icon.svg";
import IDCIcon from "../../assets/icons/home/income-driver-calculator-icon.svg";
import PLIcon from "../../assets/icons/home/procurement-lib-icon.svg";
import CIIIcon from "../../assets/icons/home/cii-icon.svg";
import IDHBnIcon from "../../assets/icons/home/idh-business-icon.svg";

import IncomeMeasurementImg from "../../assets/images/home/income-measurement-img.png";
import IDCImg from "../../assets/images/home/income-driver-calculator-img.png";
import PLImg from "../../assets/images/home/procurement-lib-img.png";
import CIIImg from "../../assets/images/home/cii-img.png";
import IDHBnImg from "../../assets/images/home/idh-business-img.png";

export const toolResourceItems = [
  {
    icon: IncomeMeasurementIcon,
    title: "Income measurement guidance tool",
    description:
      "Supports companies in streamlining their approach to measuring actual household income across multiple commodities and regions, while taking into account available resources and sources of required data (both primary and secondary)",
    order: 1,
    list: [
      "Customisable, simple, and intuitive",
      "Grounded in established, recognised methodologies",
      "Facilitates data comparability across and within regions",
    ],
    image: IncomeMeasurementImg,
    linkToStepText: "Links to step 2 of the LI Roadmap.",
    link: "#",
  },
  {
    icon: IDCIcon,
    title: "Income Driver Calculator",
    description:
      "The Income Driver Calculator is an online tool that supports companies to assess the size of the (living) income gap for their farming partners and take data driven decisions on the most effective strategies, using aggregated data.",
    order: 2,
    list: [
      "Enable data-driven decision-making and alignment across stakeholders",
      "Model intervention scenarios and asses their impact on the income gap",
      "Use data visualisation to enhance partner engagement",
    ],
    image: IDCImg,
    linkToStepText: "Links to step 3 & 4 of the LI Roadmap.",
    link: "/income-driver-calculator",
  },
  {
    icon: PLIcon,
    title: "Procurement Library",
    description:
      "The tool supports businesses in identifying best practices aligned with their goals, accessing tailored procurement advice, and exploring a curated library of interventions.",
    order: 3,
    list: [
      "Self-assessment feature to evaluate specific needs",
      "Comprehensive list of practices within the Interventions Library",
      "Intuitive filters for easy navigation and exploration",
    ],
    image: PLImg,
    linkToStepText: "Links to step 4 of the LI Roadmap.",
    link: "/procurement-library",
  },
  {
    icon: CIIIcon,
    title: "Cocoa Income Inventory",
    description:
      "The tool enables exploration of data on cocoa production, cocoa-related income, and other key indicators from different origins through an interactive dashboard.",
    order: 4,
    list: [
      "Structured sharing of aggregated cocoa sector data in a pre-competitive setting",
      "Complimentary to the CHIS (Cocoa Household Income Study approach) methodology",
      "Access to validated data reduces research duplication and boosts efficiency",
    ],
    image: CIIImg,
    linkToStepText: "Links to step 4 and 5 of the LI Roadmap.",
    link: "/cocoa-income-inventory",
  },
  {
    icon: IDHBnIcon,
    title: "IDH business analytics",
    description:
      "Provides insights into the operations and economics of smallholder-inclusive business models, exploring scenarios and providing actionable recommendations to improve efficiency, effectiveness, and sustainability.",
    order: 5,
    list: [
      "Insights and recommendations based on 120+ business model case studies",
      "Systems change approach to assess models and recommend tailored strategies",
      "Boosts impact, commercial viability and investabillity of smallholder-inclusive businesses",
    ],
    image: IDHBnImg,
    linkToStepText: "Links to step 2,3 & 4 of the LI Roadmap.",
    link: "#",
  },
];
