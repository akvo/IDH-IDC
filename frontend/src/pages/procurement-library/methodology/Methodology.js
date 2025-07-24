import React from "react";
import "./methodology.scss";
import { Blocker } from "../../../components/utils";
import { useWindowDimensions } from "../../../hooks";

const Methodology = () => {
  const { isMobile } = useWindowDimensions();

  if (isMobile) {
    return <Blocker backRoute="/procurement-library" />;
  }

  return (
    <div className="methodology-container">
      <div className="methodology-header">
        <span>
          <h1>Context &amp; Methodology</h1>
        </span>
      </div>
      <div className="methodology-content">
        <div className="methodology-content-item">
          <h2>Context</h2>
          <div className="methodology-content-item-group">
            <p className="first-paragraph">
              This sustainable procurement library is an outcome of a larger
              assignment commissioned by IDH under the Living Income Roadmap in
              collaboration with Ernst and Young to explore the potential for
              leveraging changes in procurement practices to impact farmer
              income and environmental outcomes.
            </p>
            <p>
              This work builds on a previous collaboration between IDH with Mars
              and the Farmer Income Lab to explore how procurement practices can
              be leveraged to close living income gaps how innovative
              procurement strategies are a crucial component of a smart mix of
              interventions, enabling smallholder farmers to achieve a living
              income.
            </p>
          </div>
          <blockquote>
            <span>
              If you are interested in conducting a deeper business performance
              and farmer profitability your specific supply chains please also
              check out our Inclusive Business Analytics{" "}
              <a
                href="https://farmfitinsightshub.org/resources/procurement-and-supply-chain-module"
                target="_blank"
                rel="noreferrer"
              >
                module on Procurement and supply chain.
              </a>
            </span>
          </blockquote>
          <h2>Methodology</h2>
          <div className="methodology-content-item-group">
            <strong>Research approach and stakeholder input</strong>
            <p>
              While populating the Procurement Library, the methodology began
              with an extensive desk research and interviews with key
              stakeholders, including procurement professionals and industry
              experts within the agricultural and food supply chains. This
              initial phase helped identify existing sustainable practices that
              have demonstrated innovation and impact on both farmers&apos;
              income and environmental stewardship. The insights gathered from
              this process contributed to a foundational understanding of the
              current landscape and informed the subsequent steps of the
              methodology.
            </p>
          </div>
          <div className="methodology-content-item-group">
            <strong>Holistic perspective</strong>
            <p>
              Throughout the initial assessment and exploration of practices, a
              holistic perspective was maintained, considering not only the
              potential positive impacts on the environment and income but also
              evaluating the ease of implementation and potential risks
              associated with adopting these practices. This comprehensive
              approach ensures that the resulting sustainable procurement
              framework is not only aspirational but also practical and feasible
              for implementation in various agricultural settings.
            </p>
          </div>
          <div className="methodology-content-item-group">
            <strong>Framework structure</strong>
            <p>
              The framework is meticulously structured, bifurcated into two
              pivotal domains encompassing both qualitative and quantitative
              elements. Within the quantitative section, the focus lies on the
              enabling conditions of a practice. This involves a nuanced
              examination of the rationale from a business standpoint,
              considering critical factors such as cost, revenue, and risk
              perspectives. Furthermore, a dedicated lens is applied from the
              farmer&apos;s perspective, intricately analysing the environmental
              and income rationale associated with the adoption of specific
              practices.
            </p>
            <p>
              Under the quantitative domain, an exhaustive evaluation is
              undertaken to assess the risks and potential trade-offs entwined
              with each identified practice. This comprehensive analysis ensures
              a thorough understanding of the multifaceted implications and
              considerations. Lastly, the framework synthesizes these insights
              by incorporating an evaluation of the intervention&apos;s impact
              from both an income and environmental standpoints. This holistic
              approach ensures that the sustainable procurement practices
              shortlisted in the library aligns with business imperatives while
              also prioritizes the welfare of farmers, addresses environmental
              concerns, and navigates potential risks and unintended
              consequences.
            </p>
            <p>
              The quantitative based filtering mechanism of the procurement
              library, serving as the core of the modelling process, is
              comprised of five key factors categorized into supply chain,
              market, and business considerations. First, the position of the
              business within the supply chain, discerning its role and
              influence on the overall procurement dynamics. Secondly, the level
              of market formality in which the business operates is examined,
              providing insights into the regulatory and structural aspects
              shaping its interactions.
            </p>
            <p>
              Within the business factors, the framework delves into the total
              value addition throughout a product&apos;s life cycle, deciphering
              the comprehensive impact of the business&apos;s activities.
              Additionally, the size of the business within the supply chain is
              a pivotal factor, offering an understanding of its scale and reach
              in the broader context.
            </p>
            <p>
              Each of these factors is characterised by specific levels,
              introducing a nuanced granularity to the analysis. This detailed
              categorisation ensures an estimated assessment of the quantitative
              elements, facilitating a more refined shortlisting process
              allowing to navigate the longer list of practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Methodology;
