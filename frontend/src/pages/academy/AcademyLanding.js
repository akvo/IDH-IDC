import React, { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AcademyHero from "./components/AcademyHero";
import AcademyAbout from "./components/AcademyAbout";
import AcademyRoadmap from "./components/AcademyRoadmap";
import AcademyCta from "./components/AcademyCta";
import AcademyToolsResources from "./components/AcademyToolsResources";
import AcademyPartners from "./components/AcademyPartners";
import { showIdcAccessRequestModal } from "../../components/utils";
import { FooterDisclaimer } from "../income-driver-calculator/components";
import "./AcademyLanding.scss";

const AcademyLanding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const modalShownRef = useRef(false);

  useEffect(() => {
    if (location.state?.unauthorizedIDC && !modalShownRef.current) {
      modalShownRef.current = true;
      showIdcAccessRequestModal();
      navigate(location.pathname, { replace: true, state: {} });
    } else if (!location.state?.unauthorizedIDC) {
      modalShownRef.current = false;
    }
  }, [location.pathname, location.state, navigate]);

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
