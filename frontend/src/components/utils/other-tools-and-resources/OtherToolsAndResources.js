import "./other-tool-resources.scss";

import { Link } from "react-router-dom";
import { Divider } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { OtherToolResourceList } from "..";
import { useWindowDimensions } from "../../../hooks";

const OtherToolsAndResources = () => {
  const { isMobile } = useWindowDimensions();

  return (
    <div
      className={`other-tools-recources-container ${
        isMobile ? "mobile-screen" : ""
      }`}
    >
      <Divider />
      <div className="other-tools-title-wrapper">
        <div>
          <h2>Toolkit for Better Incomes</h2>
          <p>Find other tools and resources of IDH and its partners below</p>
        </div>
        <div>
          <Link to="/tools-and-resources" className="button button-green-fill">
            Explore all Resources{" "}
            <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 900 }} />
          </Link>
        </div>
      </div>
      <OtherToolResourceList
        size={3}
        showMoreButton={false}
        isLandingPage={true}
      />
    </div>
  );
};

export default OtherToolsAndResources;
