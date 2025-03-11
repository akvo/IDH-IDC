import PAIcon from "../../assets/icons/cii-pch/public-availability.png";
import CSIcon from "../../assets/icons/cii-pch/consequences.png";
import HAIcon from "../../assets/icons/cii-pch/harmonized.png";

export const pchContent = [
  {
    icon: PAIcon,
    title: "Public availability",
    description:
      "For years, various organizations, including academic institutions, service providers, and cocoa and chocolate companies, have gathered crucial data on cocoa farming and conducted impact evaluations. However, due to various barriers, these datasets and findings are rarely made publicly available.",
  },
  {
    icon: CSIcon,
    title: "Consequences",
    description:
      "The lack of accessible, high-quality data leads to suboptimal policies and interventions. Without reliable evidence, mistakes are repeated, intervention designs rely on unverified assumptions, and resources are allocated inefficiently. This not only reduces impact but also creates reputational risks when expected improvements fail to materialize.",
  },
  {
    icon: HAIcon,
    title: "Harmonised data collection",
    description: (
      <>
        If data is shared, it is often not collected in the same way, hampering
        the comparability of results. Therefore, a publicly available
        methodology for income measurement called{" "}
        <u>Cocoa Household Income Study Approach (CHIS)</u> was developed.
        <sup>1</sup> The CII is designed to be complimentary to the CHIS
        methodology, making use of the alignment that CHIS can provide.
      </>
    ),
  },
];
