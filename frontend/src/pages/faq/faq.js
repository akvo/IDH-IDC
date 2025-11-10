import React from "react";
import { PageTitle, PageFooter } from "../../components/layout";
import "./faq.scss";
import { Collapse } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { IDCSubMenu } from "../cases/components";
import { showIDCSubMenu } from "../../components/route";

const faqContents = [
  {
    label: "How can I access the Income Driver Calculator (IDC) ?",
    children: (
      <>
        The Income Driver Calculator (IDC) can be accessed through the weblink:{" "}
        <a
          href="https://incomedrivercalculator.idhtrade.org/"
          target="_blank"
          rel="noreferrer"
        >
          idc.idhtrade.org
        </a>{" "}
        or from the Toolkit section of the{" "}
        <a
          href="https://www.idhsustainabletrade.com/roadmap-on-living-income/"
          target="_blank"
          rel="noreferrer"
        >
          Roadmap on Living Income page
        </a>
        , on the IDH website. On the landing page of the tool, click on “Sign
        In”.
        <br />
        If you are a new user, you need to Register to access the tool by
        “Reaching out to your point of Contact at IDH or by dropping an enquiry
        to the Living Income team via email on{" "}
        <a
          href="mailto:livingincome@idhtrade.org"
          target="_blank"
          rel="noreferrer noopener"
        >
          livingincome@idhtrade.org
        </a>
        The team will reach out to you to schedule a call to understand the
        Company’s requirements and provide a demo of the tool. After the demo,
        your access to the tool will be activated and a user manual will be
        shared for future reference. The team will be available on email and
        call to support with further queries.
      </>
    ),
  },
  {
    label: "How can IDH’s IDC support your company ?",
    children: (
      <>
        IDH collaborates with companies to enhance their positive impact on
        living income, which is a contributor to key sustainability challenges
        like child labour and environmental degradation. Our{" "}
        <a
          href="https://www.idhsustainabletrade.com/roadmap-on-living-income/"
          target="_blank"
          rel="noreferrer"
        >
          Living Income Roadmap
        </a>{" "}
        outlines a range of steps, guiding questions and data-driven tools like
        the IDC, to support companies to take action on living income. We
        convene a Business Action Committee (BAC) that proactively guides the
        strategic direction of the roadmap to increase company action. The BAC
        consists of a committed group of people from global food and
        agribusiness companies, as well as thought leaders, who are pioneering
        on closing living income gaps in supply chains. The team can be reached
        at{" "}
        <a
          href="mailto:livingincome@idhtrade.org"
          target="_blank"
          rel="noreferrer noopener"
        >
          livingincome@idhtrade.org
        </a>
        .
      </>
    ),
  },
  {
    label:
      "What kind of analysis does the IDC provide on Farmer household income ?",
    children: (
      <>
        The IDC tool allows companies to make data driven strategic decisions to
        close the income gap for the farmer households in their supply chain,
        through the following steps and analyses:
        <ul>
          <li>
            Measure the (Living)income gap for each farmer segment, based on the
            current household (HH) income data.
          </li>
          <li>
            Identify the most impactful income drivers (and value ranges) that
            can contribute to bridge the income gap, through Sensitivity
            analysis.
          </li>
          <li>
            Analyse the impact of other diversified income sources on HH income.
          </li>
          <li>
            Model different scenarios of interventions to close the income gap.
          </li>
        </ul>
      </>
    ),
  },
  {
    label: "What kind of input data is needed to use the IDC tool ?",
    children: (
      <>
        A user needs the following input data, to use the tool:
        <ul>
          <li>Primary commodity and country of interest.</li>
          <li>Farmer segments.</li>
          <li>
            • Aggregate data per farmer segment for the five income drivers:
            Land size, Volume, Price, Cost of production (all, for the primary
            commodity) and other on-farm and off-farm Diversified income values
            (for the farmer household).
          </li>
        </ul>
        Companies that need guidance on collecting the required input data, can
        also refer to the{" "}
        <a
          href="https://idh.org/resources/income-measurement-guidance"
          target="_blank"
          rel="noreferrer"
        >
          Income measurement guidance tool
        </a>{" "}
        (IMG). The tool enables companies to streamline the household income
        data collection process, by building custom surveys, based on primary
        commodity, availability of secondary data and availability of resources
        for a lean / detailed data collection. The income data output from the
        IMG tool can directly be applied into the IDC tool for analyses. The
        tool is now available for 6 key commodities namely, Coffee, Cocoa,
        Cotton, Tea, Spices and Palm.
      </>
    ),
  },
  {
    label:
      "Can companies use the IDC to analyse performance on their custom income target ?",
    children:
      "Yes. Companies can either “Set their own income target” or use the available “Living income benchmark” as target for the programs they will analyse on the IDC tool.",
  },
  {
    label:
      "How does user management work for my company, on the IDC tool? Can multiple teams (from different regions / business functions) and organisations collaborate on the tool ?",
    children:
      "Yes, the tool allows users to provide “View” or “Edit” access to their projects (or Cases) to multiple users within or outside of an organisation. Similar to a shareable Google document, the projects on the tool can be shared with teams across multiple countries, business units or organisations.",
  },
];

const FAQ = ({ showPageTitle = true, showPageFooter = true }) => {
  return (
    <div id="faq-page">
      {showPageTitle && showIDCSubMenu() ? <IDCSubMenu /> : ""}

      {showPageTitle ? <PageTitle title="Frequently Asked Questions" /> : ""}

      <div className="content-wrapper">
        {faqContents.map((item, ti) => (
          <Collapse
            key={`collapse-${ti}`}
            items={[
              {
                ...item,
                label: `${ti + 1}. ${item.label}`,
                key: ti + 1,
              },
            ]}
            expandIconPosition="end"
            expandIcon={({ isActive }) =>
              isActive ? (
                <UpOutlined style={{ color: "#01625F" }} />
              ) : (
                <DownOutlined style={{ color: "#01625F" }} />
              )
            }
          />
        ))}
      </div>

      {showPageFooter ? <PageFooter isLandingPage={false} /> : ""}
    </div>
  );
};

export default FAQ;
