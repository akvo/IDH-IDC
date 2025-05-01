import React from "react";
import { Popconfirm } from "antd";
import "./landingcomp.scss";

import SmartMix from "../../../assets/images/smart-mix-of-strategies.png";

const PizzaDiagram = () => {
  const slices = [
    {
      key: 1,
      placement: "leftTop",
      title: "Enabling environment",
      description:
        "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
    },
    {
      key: 2,
      placement: "rightTop",
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
      placement: "rightBottom",
      title: "Consumer engagement & product innovation",
      description:
        "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
    },
    {
      key: 5,
      placement: "leftBottom",
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

const ExploreStudies = () => {
  return (
    <div id="explore-studies" data-testid="explore-studies-wrapper">
      <div className="text-wrapper">
        <h2 data-testid="explore-studies-title">
          ‘Smart-mix’ of strategies to close income gaps
        </h2>
        <p data-testid="explore-studies-subtitle" style={{ width: "85%" }}>
          To deliver results at farm level with multiple income drivers, IDH
          believes that stakeholders need to change their own behaviour (e.g.
          business practices), at various levels i.e. at national, landscape,
          and sector levels. This means strategies that can improve income
          drivers go far beyond addressing changes in the farm system and
          household behaviour.
          <br />
          <br />
          Each of these strategies should influence an improvement in one or
          multiple income drivers, or the underlying conditions that enable an
          improvement in income drivers. As you iterate feasible values and the
          impact it has on income, the more you might have to explore to
          identify appropriate strategies.
        </p>
      </div>
      <div className="pizza-wrapper">
        <PizzaDiagram />
      </div>
    </div>
  );
};

export default ExploreStudies;
