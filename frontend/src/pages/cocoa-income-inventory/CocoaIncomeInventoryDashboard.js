import React from "react";
import "./cii-dashboard.scss";
import { useNavigate } from "react-router-dom";
import { Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { FooterDisclaimer } from "../income-driver-calculator/components";
import { FileDownloadIcon } from "../../lib/icon";

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
              window.open(
                "/files/methodology-cocoa-income-inventory.pdf",
                "_blank"
              );
            }}
          >
            <Space align="middle" size={2}>
              Methodology
              <FileDownloadIcon />
            </Space>
          </Button>
          <Button
            className="button-yellow-fill"
            onClick={() => {
              window.open(
                "/files/Cocoa-Income-Inventory_2020-2023_February_2025.xlsx"
              );
            }}
          >
            <Space align="middle" size={2}>
              CII Data
              <FileDownloadIcon />
            </Space>
          </Button>
        </div>
      </div>
      {/* EOL Page title section */}

      {/* Power BI iframe section */}
      <div className="cii-dashboard-power-bi-iframe-wrapper">
        <iframe
          title="CCI Dashboard"
          src="https://app.powerbi.com/view?r=eyJrIjoiNDIxZjA2YWYtMzkyOS00M2RhLThmYzUtOTQ1ZTBiNzU3MGMxIiwidCI6ImIxNzBlMTE1LWRjM2QtNGU5Mi04NWJlLWU0YjMwMDljNWRjMiIsImMiOjl9&pageName=9c4db46b6b34e25914c5"
          style={{
            position: "absolute",
            top: 24,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        ></iframe>
      </div>
      {/* EOL Power BI iframe section */}

      <FooterDisclaimer disclaimerText="cii" showPageFooter={true} />
    </div>
  );
};

export default CocoaIncomeInventoryDashboard;
