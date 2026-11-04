import React from "react";
import { Button } from "antd";
import CtaPattern from "../../../assets/images/academy/cta-pattern.svg";

const AcademyCta = ({ onStartLearningClick }) => {
  return (
    <section className="academy-cta-section" aria-label="Call to Action">
      <div className="section-container">
        <div className="cta-card">
          <div className="cta-pattern-bg">
            <img src={CtaPattern} alt="" aria-hidden="true" />
          </div>

          <div className="cta-content">
            <h2 className="cta-title">
              Ready to accelerate your Living Income journey?
            </h2>
            <p className="cta-subtitle">
              Gain the knowledge, tools, and confidence to turn strategy into
              measurable impact.
            </p>
            <div className="cta-action">
              <Button
                type="default"
                className="cta-start-btn"
                onClick={onStartLearningClick}
                aria-label="Start Learning"
              >
                Start Learning
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademyCta;
