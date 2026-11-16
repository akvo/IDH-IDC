import React from "react";
import { FooterDisclaimer } from "../../income-driver-calculator/components";
import PartnerIdhLogo from "../../../assets/images/academy/partner-idh.png";
import PartnerSflLogo from "../../../assets/images/academy/partner-sfl.png";
import PartnerLicopLogo from "../../../assets/images/academy/partner-licop.png";
import PartnerRvoLogo from "../../../assets/images/academy/partner-rvo.png";

const partnerLogos = [
  { id: "idh", name: "IDH", logo: PartnerIdhLogo },
  { id: "sfl", name: "Sustainable Food Lab", logo: PartnerSflLogo },
  {
    id: "licop",
    name: "The Living Income Community of Practice",
    logo: PartnerLicopLogo,
  },
  {
    id: "rvo",
    name: "Netherlands Enterprise Agency (RVO)",
    logo: PartnerRvoLogo,
  },
];

const AcademyFooter = () => (
  <footer className="academy-footer" data-testid="academy-footer">
    <div className="academy-footer-partners">
      {partnerLogos.map((partner) => (
        <img
          key={partner.id}
          src={partner.logo}
          alt={`${partner.name} logo`}
          className="academy-footer-partner-logo"
        />
      ))}
    </div>
    <FooterDisclaimer disclaimerText="academy" showFAQNav={true} />
  </footer>
);

export default AcademyFooter;
