import React from "react";
import { PageTitle, PageFooter } from "../../components/layout";
import { OtherToolResourceList } from "../../components/utils";
import "./other-resources.scss";

const OtherResources = () => {
  return (
    <div id="other-resources">
      <PageTitle
        title="Tools and Resources"
        subTitle="Find other tools and resources of IDH and its partners below"
      />

      <div className="content-wrapper">
        <OtherToolResourceList />
      </div>

      <PageFooter />
    </div>
  );
};

export default OtherResources;
