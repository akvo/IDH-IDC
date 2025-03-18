import React from "react";
import { LandingIDHLogo } from "../../lib/icon";

const PageTitle = ({ title = "", subTitle = "" }) => {
  return (
    <div className="page-title-layout-container">
      <div className="page-title-layout-header-wrapper">
        <LandingIDHLogo
          style={{
            position: "absolute",
            bottom: -190,
            right: -130,
            transform: "rotate(260deg)",
          }}
          width={300}
          height={300}
          color="#92CCFA"
        />
        <div className="title-wrapper">
          <h1>{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>
    </div>
  );
};

export default PageTitle;
