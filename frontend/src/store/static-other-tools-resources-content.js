import Image1 from "../assets/images/other-tool-resource/income-measurement-guidance-tool.png";
import Image2 from "../assets/images/other-tool-resource/cocoa-income-inventory.png";
import Image3 from "../assets/images/other-tool-resource/procurement-library.png";
import Image4 from "../assets/images/other-tool-resource/reporting-standards.png";
import Image5 from "../assets/images/other-tool-resource/procurement-pratices-principles.png";
// import { ArrowRightOutlined } from "@ant-design/icons";

export const otherToolsAndResourcesContent = [
  {
    tag: "Tool",
    image: Image1,
    title: "Income Measurement Guidance Tool",
    description:
      "This tool streamlines household income assessments, allowing you to measure total income while optimizing primary and secondary data use.",
    order: 1,
    button: {
      href: "https://idh-prp.files.prepr.io/1wk73l1s25z4-income-measurement-guidance-tool-img-idh.zip",
      type: "download",
      text: "Download",
    },
  },
  {
    tag: "Tool",
    image: Image2,
    title: "Cocoa Income Inventory",
    description:
      "The tool allows you to explore data on cocoa production, income from cocoa and other key indicators from different origins. Play around with the data using an interactive dashboard.",
    order: 2,
    button: {
      href: "/cocoa-income-inventory",
      type: "link",
      text: "Explore the tool",
    },
  },
  {
    tag: "Tool",
    image: Image3,
    title: "Procurement Library",
    description:
      "The tool helps businesses identify the best interventions for their goals, access personalized procurement advice, and explore the intervention library.",
    order: 3,
    button: {
      href: "/procurement-library",
      type: "link",
      text: "Explore the tool",
    },
  },
  {
    tag: "Paper",
    image: Image4,
    title: "Navigating Due Dilligence and Reporting Standards",
    description:
      "This paper by IDH, WUR and the Voice Network, provides guidance on how IDH tools and resources can support on Due Diligence and Reporting standards.",
    order: 4,
    button: {
      href: null,
      type: "download",
      text: "Download",
    },
  },
  {
    tag: "Paper",
    image: Image5,
    title: "Procurement Practices Principles",
    description:
      "Introduces the main principles to be adopted by the DISCO partners as part of their living income strategies.",
    order: 5,
    button: {
      href: "https://www.idhsustainabletrade.com/uploaded/2024/04/DISCO-Procurement-Practices-Position-Paper.pdf",
      type: "new-window",
      text: "Download",
    },
  },
];
