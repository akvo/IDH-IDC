import "./pizza.scss";
import { Popconfirm } from "antd";
import SmartMix from "../../assets/images/smart-mix-of-strategies.png";

const slices = [
  {
    key: 1,
    placement: "top",
    title: "Enabling environment",
    description:
      "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
  },
  {
    key: 2,
    placement: "top",
    title: "Production and processing",
    description:
      "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
  },
  {
    key: 3,
    placement: "right",
    title: "Procurement practices",
    description:
      "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
  },
  {
    key: 4,
    placement: "bottom",
    title: "Consumer engagement & product innovation",
    description:
      "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
  },
  {
    key: 5,
    placement: "bottom",
    title: "Tranceability & transparancy",
    description:
      "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
  },
  {
    key: 6,
    placement: "left",
    title: "Sector and landscape management",
    description:
      "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
  },
];

const PizzaDiagram = () => {
  return (
    <div className="pie-container">
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
