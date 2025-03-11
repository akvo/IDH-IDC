import React from "react";
import "./cii-dashboard.scss";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { FooterDisclaimer } from "../landing/components";

const CocoaIncomeInventoryDashboard = () => {
  const navigate = useNavigate();
  return (
    <div id="cii-dashboard-page">
      {/* Page title section */}
      <div className="cii-dashboard-page-title-wrapper">
        <h1>Cocoa Income Inventory Dashboard</h1>
        <p>
          Explore the data and learn more about cocoa production in different
          regions
        </p>
        <div className="btn-wrapper">
          <Button
            className="button-green-transparent"
            onClick={() => {
              navigate("/cocoa-income-inventory");
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back
          </Button>
          <Button
            className="button-yellow-fill"
            onClick={() => {
              navigate("/cocoa-income-inventory");
            }}
          >
            Methodology <DownloadOutlined style={{ fontSize: 12 }} />
          </Button>
        </div>
      </div>
      {/* EOL Page title section */}

      {/* Power BI iframe section */}
      <div className="cii-dashboard-power-bi-iframe-wrapper">
        <iframe
          src="https://s3-alpha-sig.figma.com/img/f1ba/6bff/fc0decb6de0e773928e8d2475538eb2e?Expires=1742774400&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=Z9Fyh-6-GctzC7uKB9-Br5BEoV-VkQTEyxTFgCxniaYrVzD2hZRT-MgnEugmhP2Pw1BaRUlGPFxXk-0GUppQVoxOM3OV4PNfxVp9o5We67m9H9IuybLkvtkkivjc0A6cmOBDFoinubxMLrHXPlvOYKlybTTaGqQeC6OzOy54ViNbomu18rSh6BMcuSqzfoL0SSJ1DE7tIYE-VY4yMPnYdu0~tGs3~KF-pJ~aoqLpTnjiar~IcIKz0wttrVVQPXf6fB2YGSyrmem8qrHJjwJKgSwagUINZWKlq5AYUiAejENFKIKbwI7LdgL5EKEf5wywqT4usSPblYXjqXOlEbW2LQ__"
          style={{
            position: "absolute",
            top: 24,
            left: "15%",
            width: "100%",
            height: "100%",
            border: "none",
          }}
        ></iframe>
      </div>
      {/* EOL Power BI iframe section */}

      <FooterDisclaimer />
    </div>
  );
};

export default CocoaIncomeInventoryDashboard;
