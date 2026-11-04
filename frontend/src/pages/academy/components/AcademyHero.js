import React from "react";
import { Button } from "antd";
import ArrowRight from "../../../assets/icons/academy/arrow-right.svg";
import HeroBg from "../../../assets/images/academy/hero-bg.png";

const AcademyHero = ({ onExploreClick }) => {
  return (
    <section className="academy-hero" aria-label="Academy Hero Banner">
      <div className="hero-background-wrapper">
        <img
          src={HeroBg}
          alt="Living Income Academy participants in discussion"
          className="hero-background-image"
        />
        <div className="hero-overlay" />
      </div>

      <div className="hero-content-container">
        <div className="hero-text-block">
          <h1 className="hero-title">
            Expertise What Drives Living Income Impact
          </h1>
          <p className="hero-description">
            Build the practical expertise to design, implement and scale living
            income strategies across your value chain. Whether you are just
            beginning your living income journey or strengthening existing
            programmes, the Living Income Academy gives you structured guidance,
            expert insights, practical tools and real-world examples to support
            your decisions.
          </p>
        </div>

        <div className="hero-action">
          <Button
            type="primary"
            className="hero-cta-btn"
            onClick={onExploreClick}
            aria-label="Explore the Academy"
          >
            <span>Explore the Academy</span>
            <img src={ArrowRight} alt="" className="btn-arrow-icon" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AcademyHero;
