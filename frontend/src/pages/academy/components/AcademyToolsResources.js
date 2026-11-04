import React from "react";
import { OtherToolsAndResources } from "../../../components/utils";

const AcademyToolsResources = ({
  toolsOrderForLandingPage = ["IMG", "CII", "PL"],
  title = "Tools and resources",
  description = "Find other tools and resources of IDH and its partners below",
}) => {
  return (
    <section
      className="academy-tools-section"
      id="academy-tools-resources"
      aria-label="Tools and Resources"
    >
      <OtherToolsAndResources
        title={title}
        description={description}
        toolsOrderForLandingPage={toolsOrderForLandingPage}
      />
    </section>
  );
};

export default AcademyToolsResources;
