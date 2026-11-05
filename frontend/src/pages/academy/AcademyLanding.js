import React, { useCallback } from "react";
import AcademyHero from "./components/AcademyHero";
import AcademyAbout from "./components/AcademyAbout";
import AcademyRoadmap from "./components/AcademyRoadmap";
import AcademyCta from "./components/AcademyCta";
import AcademyToolsResources from "./components/AcademyToolsResources";
import AcademyPartners from "./components/AcademyPartners";
import { FooterDisclaimer } from "../income-driver-calculator/components";
import "./AcademyLanding.scss";

const AcademyLanding = () => {
  const handleExploreClick = useCallback(() => {
    const aboutSection = document.getElementById("academy-about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleStartLearningClick = useCallback(() => {
    const roadmapSection = document.getElementById("academy-roadmap");
    if (roadmapSection) {
      roadmapSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="academy-landing-page" data-testid="academy-landing-page">
      <AcademyHero onExploreClick={handleExploreClick} />
      <AcademyAbout />
      <AcademyRoadmap />
      <AcademyCta onStartLearningClick={handleStartLearningClick} />
      <AcademyToolsResources />
      <AcademyPartners />
      <FooterDisclaimer disclaimerText="academy" showFAQNav={true} />
    </div>
  );
};

export default AcademyLanding;
