import PAIcon from "../../../assets/icons/cii-pch/public-availability.png";
import CSIcon from "../../../assets/icons/cii-pch/consequences.png";
import HAIcon from "../../../assets/icons/cii-pch/harmonized.png";
import { QuestionCircleOutline } from "../../../lib/icon";
import { Button, Tooltip } from "antd";

const harmonizedDataCollectionTooltip =
  "The development of CHIS was led and funded by WCF with co-funding from the German Federal Ministry for Economic Cooperation and Development (BMZ) and in collaboration with the German Development Cooperation (GIZ) and the Swiss Platform for Sustainable Cocoa (SWISSCO). It was delivered by Wageningen University & Research (WUR) and the Royal Tropical Institute (KIT) with assistance in Côte d’Ivoire from the Centre Ivoirien de Recherches Economiques et Sociales (CIRES) and Etudes de Marché et Conseils (EMC).The methodology was also completed with guidance from the Alliance on Living Income in Cocoa (ALICO), and with inputs from numerous stakeholders across the cocoa sector including representatives from producing country governments, other NGOs, and civil society organizations and WCF member companies. NB: The Alliance of Living Income in Cocoa (ALICO) includes the Living Income Community of Practice (LICOP), the Voice Network, IDH, GISCO, SWISSCO, DISCO and Beyond Chocolate.";

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
        <a
          href="https://edepot.wur.nl/652510"
          target="_blank"
          rel="noreferrer noopener"
        >
          Cocoa Household Income Study Approach (CHIS)
        </a>{" "}
        was developed.<sup>1</sup>{" "}
        <Tooltip title={harmonizedDataCollectionTooltip} arrowContent={null}>
          <Button icon={<QuestionCircleOutline />} type="link" />
        </Tooltip>
        <br />
        The CII is designed to be complimentary to the CHIS methodology, making
        use of the alignment that CHIS can provide.
      </>
    ),
  },
];
