import React, { useEffect, useState } from "react";
import { Button, Space } from "antd";
import { useNavigate } from "react-router-dom";
import "./coming-soon.scss";
import { Blocker } from "../../../components/utils";
import { useWindowDimensions } from "../../../hooks";
import ComingSoonGearIcon from "../../../assets/icons/procurement-library/coming-soon-gear.png";
import { ArrowLeftOutlined } from "@ant-design/icons";

const ComingSoonCard = () => {
  const navigate = useNavigate();
  const { isMobile } = useWindowDimensions();
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  if (isMobile) {
    return <Blocker backRoute="/procurement-library" />;
  }

  const dots = ".".repeat(countdown);

  return (
    <div className="coming-soon-container coming-soon-page">
      <div className="content-wrapper">
        <div className="coming-soon-card">
          <div className="icon-wrapper">
            <div className="icon-container">
              <img
                className="coming-soon-icon"
                src={ComingSoonGearIcon}
                alt="coming soon icon"
              />
            </div>
          </div>

          <h3>Coming soon</h3>
          <h1 className="title">The future is loading{dots}</h1>
          <p className="description">
            We’re working hard behind the scenes to bring you a brand-new
            experience. Stay tuned — the page will be launching soon.
          </p>

          <Space className="button-wrapper" size="large">
            <Button
              type="primary"
              size="large"
              onClick={() => navigate(-1)}
              className="back-button"
            >
              <ArrowLeftOutlined /> Go back
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/procurement-library")}
              className="home-button"
            >
              Take me home
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonCard;
