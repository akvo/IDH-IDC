import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./assessment.scss";
import { Blocker } from "../../../components/utils";
import { useWindowDimensions } from "../../../hooks";

const Assessment = () => {
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
    <div className="assessment-container coming-soon-page">
      <div className="background-blur">
        <div className="blur-circle blur-1"></div>
        <div className="blur-circle blur-2"></div>
        <div className="blur-circle blur-3"></div>
      </div>

      <div className="content-wrapper">
        <div className="coming-soon-card">
          <div className="icon-wrapper">
            <div className="icon-container">
              <ClockCircleOutlined
                className="main-icon"
                style={{ fontSize: 72 }}
              />
            </div>
            <div className="sparkle">✨</div>
          </div>

          <h1 className="title">Coming Soon{dots}</h1>

          <p className="subtitle">Some works still in progress</p>
          <p className="description">
            The Assessment feature is currently under development
            <br />
            and will be available soon.
          </p>

          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/procurement-library")}
            className="back-button"
          >
            Back to Procurement Library
          </Button>

          <p className="footer-text">
            Want updates? Check back soon or contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
