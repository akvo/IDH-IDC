import React from "react";
import Step1HexIcon from "../../../assets/icons/academy/step1-hex-icon.svg";
import Step2HexIcon from "../../../assets/icons/academy/step2-hex-icon.svg";
import Step3HexIcon from "../../../assets/icons/academy/step3-hex-icon.svg";
import Step4HexIcon from "../../../assets/icons/academy/step4-hex-icon.svg";
import GreenhouseImg from "../../../assets/images/academy/about-greenhouse.png";

const steps = [
  {
    icon: Step1HexIcon,
    title: "Foundations of Living Income",
    text: "Get a shared starting point: what a living income is, why it matters for your business and how it fits your sustainability and commercial goals.",
  },
  {
    icon: Step2HexIcon,
    title: "Materiality and Prioritization",
    text: "Identify where income gaps matter most in your value chain and decide which crops, regions or farmer groups to focus on first.",
  },
  {
    icon: Step3HexIcon,
    title: "Measuring Income Gaps",
    text: "Use the Income Driver Calculator and other tools to see how far farmer incomes fall short of a living income and which drivers explain the difference.",
  },
  {
    icon: Step4HexIcon,
    title: "Designing Living Income Programs",
    text: "Turn your findings into action: choose interventions, set targets and build the business case for a programme that closes the gap.",
  },
];

const AcademyAbout = () => {
  return (
    <section
      id="academy-about"
      className="academy-about-section"
      aria-labelledby="about-heading"
    >
      <div className="section-container">
        <div className="about-header-block">
          <h2 id="about-heading" className="section-title">
            What is the Living Income Academy
          </h2>
          <p className="section-lead">
            A free, step-by-step resource that follows the Roadmap on Living
            Income. Work through structured modules in your own time while
            building practical expertise you can apply straight away within your
            organisation. Here is what you will cover:
          </p>
        </div>

        <div className="about-content-grid">
          <div className="about-steps-col">
            <div className="steps-list">
              {steps.map((step, idx) => (
                <div className="step-card" key={`step-${idx}`}>
                  <div className="step-marker">
                    <img
                      src={step.icon}
                      alt=""
                      aria-hidden="true"
                      className="step-hex-icon"
                    />
                  </div>
                  <div className="step-body">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-text">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="about-image-col">
            <div className="about-image-wrapper">
              <img
                src={GreenhouseImg}
                alt="Agricultural farmer managing irrigation in plant nursery"
                className="about-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademyAbout;
