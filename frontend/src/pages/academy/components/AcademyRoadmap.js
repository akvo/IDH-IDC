import React from "react";
import RadarGraphic from "../../../assets/images/academy/roadmap-radar.svg";
import Step1Img from "../../../assets/images/academy/roadmap-step1.png";
import Step2Img from "../../../assets/images/academy/roadmap-step2.png";
import Step3Img from "../../../assets/images/academy/roadmap-step3.png";
import Step4Img from "../../../assets/images/academy/roadmap-step4.png";
import Step5Img from "../../../assets/images/academy/roadmap-step5.png";
import MarkerStep1 from "../../../assets/icons/academy/roadmap-marker-step1.svg";
import MarkerStep2 from "../../../assets/icons/academy/roadmap-marker-step2.svg";
import MarkerStep3 from "../../../assets/icons/academy/roadmap-marker-step3.svg";
import MarkerStep4 from "../../../assets/icons/academy/roadmap-marker-step4.svg";
import MarkerStep5 from "../../../assets/icons/academy/roadmap-marker-step5.svg";

const roadmapNodes = [
  {
    step: 1,
    title: "Laying the Groundwork",
    description:
      "Establish a solid foundation to act on living income, ensuring internal alignment and understanding in priority areas.",
    illustration: Step1Img,
    marker: MarkerStep1,
    side: "left",
  },
  {
    step: 2,
    title: "Measuring & Analysis",
    description:
      "Use recognised standards to identify credible living income benchmarks, calculate income gaps and assess verification options.",
    illustration: Step2Img,
    marker: MarkerStep2,
    side: "right",
  },
  {
    step: 3,
    title: "Building the Business Case",
    description:
      "Align internal and external stakeholders on the value proposition and strategic priorities. Design your Living Income strategy and mobilise resources.",
    illustration: Step3Img,
    marker: MarkerStep3,
    side: "right",
  },
  {
    step: 4,
    title: "Implementing Solutions",
    description:
      "Take coordinated, targeted action to close the living income gap. Identify priority regions, commodities or household segments and determine a smart-mix of interventions to improve income drivers.",
    illustration: Step4Img,
    marker: MarkerStep4,
    side: "right",
  },
  {
    step: 5,
    title: "Reporting & Sharing Insights",
    description:
      "Build trust, knowledge, and demonstrate compliance through transparent reporting and shared learning that supports broader advocacy.",
    illustration: Step5Img,
    marker: MarkerStep5,
    side: "left",
  },
];

const AcademyRoadmap = () => {
  return (
    <section
      id="academy-roadmap"
      className="academy-roadmap-section"
      aria-labelledby="roadmap-heading"
    >
      <div className="section-container">
        <div className="roadmap-header">
          <h2 id="roadmap-heading" className="section-title-light">
            Roadmap on Living Income
          </h2>
        </div>

        <div className="roadmap-visual-stage">
          <div className="radar-center-wrapper">
            <img
              src={RadarGraphic}
              alt="Roadmap on Living Income concentric radar graphic"
              className="radar-graphic"
            />
          </div>

          <div className="roadmap-nodes-container">
            {roadmapNodes.map((node) => {
              const isLeft = node.side === "left";
              return (
                <div
                  key={`roadmap-step-${node.step}`}
                  className={`roadmap-step-group roadmap-step-${node.step} side-${node.side}`}
                >
                  <div className="step-illustration-wrapper">
                    <img
                      src={node.illustration}
                      alt=""
                      aria-hidden="true"
                      className="step-illustration"
                    />
                  </div>

                  <div className="step-connector-row">
                    {isLeft ? (
                      <>
                        <div className="connector-line" />
                        <img
                          src={node.marker}
                          alt=""
                          aria-hidden="true"
                          className="connector-marker"
                        />
                      </>
                    ) : (
                      <>
                        <img
                          src={node.marker}
                          alt=""
                          aria-hidden="true"
                          className="connector-marker"
                        />
                        <div className="connector-line" />
                      </>
                    )}
                  </div>

                  <div className="step-content-wrapper">
                    <div className="step-content">
                      <h3 className="step-title">{node.title}</h3>
                      <p className="step-description">{node.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademyRoadmap;
