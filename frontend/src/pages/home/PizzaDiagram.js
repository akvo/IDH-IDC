import "./pizza.scss";
import { Popconfirm } from "antd";
import SmartMix from "../../assets/images/smart-mix-of-strategies.png";
import { useWindowDimensions } from "../../hooks";

const slices = [
  {
    key: 1,
    placement: "top",
    title: "Enabling environment",
    description:
      "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production, sourcing, processing, service provision, marketing, rural development and social welfare.",
  },
  {
    key: 2,
    placement: "top",
    title: "Production and processing",
    description:
      "Engagement between private sector or goverment and households/farmer groups at origin, focusing on production and processing.",
  },
  {
    key: 3,
    placement: "right",
    title: "Procurement practices",
    description: "Sourcing principles and actions.",
  },
  {
    key: 4,
    placement: "bottom",
    title: "Consumer engagement & product innovation",
    description: "Efforts around marketing, branding and product innovation.",
  },
  {
    key: 5,
    placement: "bottom",
    title: "Traceability & transparency",
    description:
      "Efforts and technologies that enable information to be shared across the value chain and among stakeholders.",
  },
  {
    key: 6,
    placement: "left",
    title: "Sector and landscape management",
    description:
      "Strategies and actions requiring alignment, coordination and/or collaboration across the sector and/or landscape.",
  },
];

const PizzaDiagram = () => {
  const { isMobile } = useWindowDimensions();

  return (
    <div className={`pie-container ${isMobile ? "mobile-screen" : ""}`}>
      {/* Background Image */}
      <img src={SmartMix} alt="smart-mix-img" className="pie-image" />

      {/* Invisible Slices */}
      {slices.map(({ key, title, description, placement }) => (
        <Popconfirm
          key={key}
          placement={placement}
          color="#fff"
          title={() => <div className="pizza-tooltip-title">{title}</div>}
          description={() => (
            <div className="pizza-tooltip-description">{description}</div>
          )}
          trigger="hover"
          showCancel={false}
          okButtonProps={{
            style: {
              display: "none",
            },
          }}
          icon={null}
        >
          <div className={`slice slice-${key}`} />
        </Popconfirm>
      ))}
    </div>
  );
};

export default PizzaDiagram;
