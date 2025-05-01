import React from "react";
import { PageTitle, PageFooter } from "../../components/layout";
import "./faq.scss";
import { Collapse } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

const faqContents = [
  {
    label: "How can I access the Income Driver Calculator (IDC)?",
    children: (
      <>
        The IDC can be accessed through{" "}
        <a
          href="https://incomedrivercalculator.idhtrade.org/"
          target="_blank"
          rel="noreferrer"
        >
          idc.idhtrade.org
        </a>{" "}
        or via the Toolkit section of the{" "}
        <a
          href="https://www.idhsustainabletrade.com/roadmap-on-living-income/"
          target="_blank"
          rel="noreferrer"
        >
          Roadmap on Living Income page
        </a>
        , on the IDH website. On the landing page, click “Sign In”. If you are a
        new user, registration is required. You can register by reaching out to
        your IDH point of contact or by emailing the Living Income team at{" "}
        <a
          href="mailto:livingincome@idhtrade.org"
          target="_blank"
          rel="noreferrer noopener"
        >
          livingincome@idhtrade.org
        </a>
        . After submitting an inquiry, the team will schedule a call to
        understand your company’s needs and provide a demo. Following the demo,
        access to the tool will be activated, and a user manual will be shared
        for future reference. The team remains available via email and call for
        ongoing support.
      </>
    ),
  },
  {
    label: "How can the IDC support your company?",
    children: (
      <>
        IDH collaborates with companies to drive a positive impact on living
        income, addressing sustainability challenges such as child labor and
        environmental degradation. Our{" "}
        <a
          href="https://www.idhsustainabletrade.com/roadmap-on-living-income/"
          target="_blank"
          rel="noreferrer"
        >
          Living Income Roadmap
        </a>{" "}
        outlines a range of steps, guiding questions and data-driven tools like
        the IDC to support companies to take action on living income.
        <br />
        <br />
        The Business Action Committee (BAC), a group of industry leaders from
        global food and agribusiness companies, helps steer the strategic
        direction of the roadmap. The BAC consists of a committed group of
        people from global food and agribusiness companies, as well as thought
        leaders, who are pioneering on closing living income gaps in supply
        chains. The team can be reached at{" "}
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
      "What kind of analysis does the IDC provide on Farmer household income?",
    children:
      "The IDC tool enables companies to make data-driven strategic decisions to close the (living) income gap for farmer households in their supply chain. It provides a structured approach by first measuring the living income gap for each farmer segment based on current household income data. It then identifies the most influential income drivers and value ranges that can help bridge the gap using sensitivity analysis. The tool also analyse the impact of diversified income sources on household income and allows users to model different intervention scenarios to assess their effectiveness in closing the income gap.",
  },
  {
    label: "What kind of input data is needed to use the IDC tool? ",
    children: (
      <>
        Users need information about the primary commodity and country of
        interest, along with farmer segments. The tool requires aggregate data
        per farmer segment for five key income drivers: land size, volume
        produced, price, cost of production, and diversified income sources from
        both on-farm and off-farm activities.
        <br />
        <br />
        Companies needing support with data collection can refer to the{" "}
        <a
          href="https://idh.org/resources/income-measurement-guidance"
          target="_blank"
          rel="noreferrer"
        >
          Income measurement guidance tool
        </a>{" "}
        (IMG), which helps streamline household income data collection. This
        tool builds custom surveys based on the primary commodity, availability
        of secondary data, and resource capacity for data collection. The output
        from the IMG tool can be directly used in the IDC. It is currently
        available for coffee, cocoa, cotton, tea, spices, and palm.
      </>
    ),
  },
  {
    label:
      "Can companies use the IDC to analyse performance against their own farmer income targets?",
    children:
      "Yes, companies can define their own income targets or use the Living Income Benchmark provided in the IDC to evaluate their programs.",
  },
  {
    label:
      "How does user management work in the IDC? Can multiple teams from different regions or business units collaborate?",
    children:
      "The IDC allows users to grant “View” or “Edit” access to projects (or cases) within or outside their organization. Similar to a shareable Google document, projects on the tool can be shared across teams, business units, and organizations.",
  },
];

const FAQ = () => {
  return (
    <div id="faq-page">
      <PageTitle title="Frequently Asked Questions" />

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

      <PageFooter />
    </div>
  );
};

export default FAQ;
