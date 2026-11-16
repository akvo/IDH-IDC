import React from "react";
import { Button } from "antd";

const RoadmapCtaBanner = ({ onLearnMore }) => (
  <section className="academy-roadmap-cta" aria-labelledby="roadmap-cta-title">
    <div>
      <h2 id="roadmap-cta-title" className="academy-roadmap-cta-title">
        Learn more about the living income roadmap
      </h2>
      <p className="academy-roadmap-cta-text">
        Discover living income roadmap with IDH
      </p>
    </div>
    <Button type="primary" onClick={onLearnMore}>
      Learn more
    </Button>
  </section>
);

export default RoadmapCtaBanner;
