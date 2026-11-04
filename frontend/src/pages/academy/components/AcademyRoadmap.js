import React from "react";
import RadarGraphic from "../../../assets/images/academy/roadmap-radar.svg";
import Step1Img from "../../../assets/images/academy/roadmap-step1.png";
import Step2Img from "../../../assets/images/academy/roadmap-step2.png";
import Step3Img from "../../../assets/images/academy/roadmap-step3.png";
import Step4Img from "../../../assets/images/academy/roadmap-step4.png";
import Step5Img from "../../../assets/images/academy/roadmap-step5.png";

const roadmapNodes = [
  {
    step: 1,
    title: "Laying the Groundwork",
    description:
      "Build the overall foundation to act on living income, ensuring internal alignment and understanding in priority areas.",
    illustration: Step1Img,
    positionClass: "pos-step-1",
  },
  {
    step: 2,
    title: "Measuring + Analysis",
    description:
      "Use actual and standard to identify credible living income benchmarks, calculate income gaps and assess root cause options.",
    illustration: Step2Img,
    positionClass: "pos-step-2",
  },
  {
    step: 3,
    title: "Building the Business Case",
    description:
      "Harmonize and align internal stakeholders on the value proposition and strategic priorities, design your Living Income strategy, and finalize the roadmap.",
    illustration: Step3Img,
    positionClass: "pos-step-3",
  },
  {
    step: 4,
    title: "Implementing Solutions",
    description:
      "Take coordinated, targeted actions to close the living income gap, identify priority regions, commodities or household segments, and determine tailored sets of interventions to improve income drivers.",
    illustration: Step4Img,
    positionClass: "pos-step-4",
  },
  {
    step: 5,
    title: "Reporting + Sharing Insights",
    description:
      "Build shared knowledge and demonstrate compliance through transparent reporting and shared learning that supports broader advocacy.",
    illustration: Step5Img,
    positionClass: "pos-step-5",
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
            {roadmapNodes.map((node) => (
              <div
                key={`roadmap-step-${node.step}`}
                className={`roadmap-node-card ${node.positionClass}`}
              >
                <div className="node-marker-row">
                  <div className="step-badge">
                    <span>{node.step}</span>
                  </div>
                  <div className="node-illustration-wrapper">
                    <img
                      src={node.illustration}
                      alt=""
                      aria-hidden="true"
                      className="node-illustration"
                    />
                  </div>
                </div>
                <div className="node-text-body">
                  <h3 className="node-title">{node.title}</h3>
                  <p className="node-description">{node.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademyRoadmap;
