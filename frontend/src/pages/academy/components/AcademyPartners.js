import React from "react";
import { Row, Col, Card } from "antd";
import PartnerIdhLogo from "../../../assets/images/academy/partner-idh.png";
import PartnerSflLogo from "../../../assets/images/academy/partner-sfl.png";
import PartnerLicopLogo from "../../../assets/images/academy/partner-licop.png";
import PartnerRvoLogo from "../../../assets/images/academy/partner-rvo.png";

const partnersData = [
  {
    id: "idh",
    name: "IDH",
    logo: PartnerIdhLogo,
    logoWidth: 130,
    text: "IDH convenes companies, governments and financiers to create better jobs, better incomes and a better environment in global value chains, including the Roadmap on Living Income this Academy follows.",
    linkHref: "https://www.idhtrade.org",
  },
  {
    id: "sfl",
    name: "Sustainable Food Lab",
    logo: PartnerSflLogo,
    logoWidth: 197,
    text: "A network of companies and NGOs working on collaborative methods and tools with agricultural production practical experience in the living income space.",
    linkHref: "https://sustainablefoodlab.org",
  },
  {
    id: "licop",
    name: "The Living Income Community of Practice",
    logo: PartnerLicopLogo,
    logoWidth: 209,
    text: "An open platform where practitioners align on frameworks and methodologies to improve incomes in supply chains, and share experiences throughout the benchmark library and throughout the sector.",
    linkHref: "https://www.livingincome-cop.com",
  },
  {
    id: "rvo",
    name: "Netherlands Enterprise Agency (RVO)",
    logo: PartnerRvoLogo,
    logoWidth: 143,
    text: "Netherlands Enterprise Agency (RVO) is a funding partner of IDH and supports programs to accelerate sustainable business, including social regulation, solutions and environmental impact in supply chains.",
    linkHref: "https://www.rvo.nl",
  },
];

const AcademyPartners = () => {
  return (
    <section
      className="academy-partners-section"
      aria-labelledby="partners-heading"
    >
      <div className="section-container">
        <div className="partners-header-block">
          <h2 id="partners-heading" className="section-title">
            Collaboration partners
          </h2>
          <p className="partners-lead">
            The Living Income Academy has been developed in partnership with
            Sustainable Food Lab, LICOP and Akvo, and thanks to the funding of
            RVO, the Netherlands Enterprise Agency. At IDH, we orchestrate
            collaboration with a broad network of partners to design, test and
            implement living income approaches across global value chains.
          </p>
        </div>

        <Row gutter={[24, 24]} className="partners-cards-row">
          {partnersData.map((partner) => (
            <Col xs={24} sm={12} lg={6} key={partner.id}>
              <Card className="partner-card-custom">
                <div className="partner-logo-container">
                  <img
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    className="partner-logo-img"
                    style={{ maxWidth: `${partner.logoWidth}px` }}
                  />
                </div>
                <div className="partner-card-content">
                  <p className="partner-description-text">{partner.text}</p>
                  <a
                    href={partner.linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="partner-discover-link"
                  >
                    Discover more
                  </a>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default AcademyPartners;
