import React from "react";
import { PlusOutlined, CloseOutlined, MinusOutlined } from "@ant-design/icons";

// Custom icons - specialised for the equation visualizer
// White variants (for the formula side)
import PriceWhite from "../../../assets/icons/equaion-visualizer/price_white.svg";
import VolumeWhite from "../../../assets/icons/equaion-visualizer/volume_white.svg";
import CopWhite from "../../../assets/icons/equaion-visualizer/cost_of_production_white.svg";
import IncomeWhite from "../../../assets/icons/equaion-visualizer/income_white.svg";

// Green variants (for the result side)
import PriceGreen from "../../../assets/icons/equaion-visualizer/price_green.svg";
import VolumeGreen from "../../../assets/icons/equaion-visualizer/volume_green.svg";
import CopGreen from "../../../assets/icons/equaion-visualizer/cost_of_production_green.svg";
import IncomeGreen from "../../../assets/icons/equaion-visualizer/income_green.svg";

// Single variant icons
import LandIcon from "../../../assets/icons/equaion-visualizer/land.svg";
import DiversifiedIcon from "../../../assets/icons/equaion-visualizer/diversified_income.svg";
import BenchmarkIcon from "../../../assets/icons/equaion-visualizer/benchmark.svg";

const IconBox = ({ icon, label, color = "#005a5b" }) => (
  <div
    style={{ textAlign: "center", display: "inline-block", margin: "0 8px" }}
  >
    <div
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "24px",
        marginBottom: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      {typeof icon === "string" ? (
        <img
          src={icon}
          alt={label}
          style={{ width: "32px", height: "32px", objectFit: "contain" }}
        />
      ) : (
        icon
      )}
    </div>
    <div
      style={{
        background: "#ebf2f2",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        color: "#005a5b",
        fontWeight: "bold",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  </div>
);

const RowSeparator = ({ icon, color = "#595959" }) => (
  <div
    style={{
      fontSize: "20px",
      color: color,
      padding: "0 4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "50px",
    }}
  >
    {icon}
  </div>
);

const EquationVisualizer = ({ selectedDriver = "cop", labels = {} }) => {
  const driverLabels = {
    price: labels.price || "Price",
    volume: labels.volume || "Volume",
    cop: labels.cop || "Cost of Production",
    land: labels.land || "Land",
  };

  const driverIconsGreen = {
    price: PriceGreen,
    volume: VolumeGreen,
    cop: CopGreen,
    land: LandIcon,
  };

  const driverColors = {
    price: "#faad14",
    volume: "#faad14",
    cop: "#faad14",
    land: "#faad14",
  };

  // Helper to render the Diversified Income breakdown block
  const DiversifiedIncomeBreakdown = ({ sign = "plus" }) => (
    <>
      <RowSeparator
        icon={
          sign === "plus" ? (
            <PlusOutlined />
          ) : (
            <MinusOutlined style={{ fontSize: "16px" }} />
          )
        }
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <IconBox icon={IncomeWhite} label="Secondary commodity income" />
        <RowSeparator
          icon={
            sign === "minus" ? (
              <MinusOutlined style={{ fontSize: "16px" }} />
            ) : (
              <PlusOutlined style={{ fontSize: "16px" }} />
            )
          }
        />
        <IconBox icon={DiversifiedIcon} label="Diversified income" />
      </div>
    </>
  );

  const renderFormulaContent = () => {
    switch (selectedDriver) {
      case "price":
      case "volume":
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              {/* Numerator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: "12px",
                }}
              >
                <IconBox icon={BenchmarkIcon} label="Benchmark" />
                <RowSeparator icon={<PlusOutlined />} />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "2px dashed #d9d9d9",
                    borderRadius: "24px",
                    padding: "8px 12px",
                  }}
                >
                  <IconBox icon={LandIcon} label="Land" />
                  <RowSeparator
                    icon={<CloseOutlined style={{ fontSize: "16px" }} />}
                  />
                  <IconBox icon={CopWhite} label="Cost of production" />
                </div>
                <DiversifiedIncomeBreakdown sign="minus" />
              </div>
              {/* Fraction Line */}
              <div
                style={{ height: "2px", background: "#00565b", width: "100%" }}
              />
              {/* Denominator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "2px dashed #d9d9d9",
                    borderRadius: "24px",
                    padding: "8px 12px",
                  }}
                >
                  <IconBox icon={LandIcon} label="Land" />
                  <RowSeparator
                    icon={<CloseOutlined style={{ fontSize: "16px" }} />}
                  />
                  <IconBox
                    icon={selectedDriver === "price" ? VolumeWhite : PriceWhite}
                    label={selectedDriver === "price" ? "Volume" : "Price"}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "cop":
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "2px dashed #d9d9d9",
                borderRadius: "24px",
                padding: "8px 12px",
              }}
            >
              <IconBox icon={VolumeWhite} label="Volume" />
              <RowSeparator
                icon={<CloseOutlined style={{ fontSize: "16px" }} />}
              />
              <IconBox icon={PriceWhite} label="Price" />
            </div>
            <RowSeparator icon={<PlusOutlined />} />
            <div
              style={{
                textAlign: "center",
                border: "2px dashed #d9d9d9",
                borderRadius: "24px",
                padding: "8px 12px",
              }}
            >
              {/* Internal Numerator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: "8px",
                }}
              >
                <IconBox
                  icon={IncomeWhite}
                  label="Secondary commodity income"
                />
                <RowSeparator
                  icon={<PlusOutlined style={{ fontSize: "12px" }} />}
                />
                <IconBox icon={DiversifiedIcon} label="Diversified income" />
                <RowSeparator
                  icon={<MinusOutlined style={{ fontSize: "12px" }} />}
                />
                <IconBox icon={BenchmarkIcon} label="Benchmark" />
              </div>
              {/* Internal Fraction Line */}
              <div
                style={{ height: "2px", background: "#00565b", width: "100%" }}
              />
              {/* Internal Denominator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: "8px",
                }}
              >
                <IconBox icon={LandIcon} label="Land" />
              </div>
            </div>
          </div>
        );
      case "land":
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              {/* Numerator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: "12px",
                }}
              >
                <IconBox icon={BenchmarkIcon} label="Benchmark" />
                <DiversifiedIncomeBreakdown sign="minus" />
              </div>
              {/* Fraction Line */}
              <div
                style={{ height: "2px", background: "#00565b", width: "100%" }}
              />
              {/* Denominator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "2px dashed #d9d9d9",
                    borderRadius: "24px",
                    padding: "8px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "2px dashed #faad14",
                      borderRadius: "20px",
                      padding: "4px 8px",
                    }}
                  >
                    <IconBox icon={VolumeWhite} label="Volume" />
                    <RowSeparator
                      icon={<CloseOutlined style={{ fontSize: "16px" }} />}
                    />
                    <IconBox icon={PriceWhite} label="Price" />
                  </div>
                  <RowSeparator icon={<MinusOutlined />} />
                  <IconBox icon={CopWhite} label="Cost of production" />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="equation-visualizer-graphic"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start", // Changed from center to prevent left cropping
        width: "100%",
        overflowX: "auto",
        padding: "20px 0",
        minHeight: "300px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "0 auto", // Center if fits, otherwise stay at start
          padding: "0 20px",
        }}
      >
        {renderFormulaContent()}

        {/* Equals Section */}
        <RowSeparator
          icon={
            <div
              style={{
                fontSize: "40px",
                fontWeight: "bold",
                margin: "0 16px",
                color: "#00565b",
              }}
            >
              =
            </div>
          }
        />

        {/* Result: Target Driver */}
        <div style={{ textAlign: "center" }}>
          <IconBox
            icon={driverIconsGreen[selectedDriver] || IncomeGreen}
            label={driverLabels[selectedDriver] || "Driver"}
            color={driverColors[selectedDriver] || "#52c41a"}
          />
        </div>
      </div>
    </div>
  );
};

export default EquationVisualizer;
