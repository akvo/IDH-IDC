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

const EquationVisualizer = ({
  selectedDriver = "cop",
  labels = {},
  category = "Crop",
}) => {
  const isAquaculture = category === "Aquaculture";

  const driverLabels = {
    price: labels.price || "Price",
    volume: labels.volume || "Volume",
    cop: labels.cop || "Cost of Production",
    land: labels.land || (isAquaculture ? "Area" : "Land"),
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

  // Helper Segment: Expanded Target Income (Benchmark - Secondary - Diversified)
  const ExpandedIncome = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px dashed #d9d9d9",
        borderRadius: "20px",
        padding: "4px 12px",
      }}
    >
      <IconBox icon={BenchmarkIcon} label="Benchmark" />
      <RowSeparator icon={<MinusOutlined style={{ fontSize: "14px" }} />} />
      <IconBox icon={IncomeWhite} label="Secondary commodity" />
      <RowSeparator icon={<MinusOutlined style={{ fontSize: "14px" }} />} />
      <IconBox icon={DiversifiedIcon} label="Diversified income" />
    </div>
  );

  const renderFormulaContent = () => {
    if (isAquaculture) {
      switch (selectedDriver) {
        case "price":
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                {/* Numerator: (ExpandedIncome / Land) - 1 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "20px",
                    padding: "8px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <ExpandedIncome />
                    <div
                      style={{
                        height: "2px",
                        background: "#00565b",
                        width: "100%",
                        margin: "4px 0",
                      }}
                    />
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                  </div>
                  <RowSeparator
                    icon={<MinusOutlined style={{ fontSize: "14px" }} />}
                  />
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#00565b",
                      padding: "0 10px",
                    }}
                  >
                    1
                  </div>
                </div>
                {/* Divide by Volume */}
                <div
                  style={{
                    height: "2px",
                    background: "#00565b",
                    width: "100%",
                    margin: "12px 0",
                  }}
                />
                <IconBox icon={VolumeWhite} label={driverLabels.volume} />
              </div>
              <RowSeparator icon={<PlusOutlined />} />
              <IconBox icon={CopWhite} label={driverLabels.cop} />
            </div>
          );
        case "volume":
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                {/* Numerator: (ExpandedIncome / Land) - 1 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "20px",
                    padding: "8px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <ExpandedIncome />
                    <div
                      style={{
                        height: "2px",
                        background: "#00565b",
                        width: "100%",
                        margin: "4px 0",
                      }}
                    />
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                  </div>
                  <RowSeparator
                    icon={<MinusOutlined style={{ fontSize: "14px" }} />}
                  />
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#00565b",
                      padding: "0 10px",
                    }}
                  >
                    1
                  </div>
                </div>
                {/* Divide by (Price - COP) */}
                <div
                  style={{
                    height: "2px",
                    background: "#00565b",
                    width: "100%",
                    margin: "12px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "16px",
                    padding: "4px",
                  }}
                >
                  <IconBox icon={PriceWhite} label={driverLabels.price} />
                  <RowSeparator
                    icon={<MinusOutlined style={{ fontSize: "14px" }} />}
                  />
                  <IconBox icon={CopWhite} label={driverLabels.cop} />
                </div>
              </div>
            </div>
          );
        case "cop":
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              <IconBox icon={PriceWhite} label={driverLabels.price} />
              <RowSeparator icon={<MinusOutlined />} />
              <div style={{ textAlign: "center" }}>
                {/* ((ExpandedIncome / Land) - 1) / Volume */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "20px",
                    padding: "8px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <ExpandedIncome />
                    <div
                      style={{
                        height: "2px",
                        background: "#00565b",
                        width: "100%",
                        margin: "4px 0",
                      }}
                    />
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                  </div>
                  <RowSeparator
                    icon={<MinusOutlined style={{ fontSize: "14px" }} />}
                  />
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#00565b",
                      padding: "0 10px",
                    }}
                  >
                    1
                  </div>
                </div>
                <div
                  style={{
                    height: "2px",
                    background: "#00565b",
                    width: "100%",
                    margin: "12px 0",
                  }}
                />
                <IconBox icon={VolumeWhite} label={driverLabels.volume} />
              </div>
            </div>
          );
        default:
          return null;
      }
    } else {
      // Crop / Livestock
      switch (selectedDriver) {
        case "price":
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                {/* Numerator: ExpandedIncome + (Land * COP) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "20px",
                    padding: "8px",
                  }}
                >
                  <ExpandedIncome />
                  <RowSeparator icon={<PlusOutlined />} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "16px",
                      padding: "4px",
                    }}
                  >
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                    <RowSeparator
                      icon={<CloseOutlined style={{ fontSize: "14px" }} />}
                    />
                    <IconBox icon={CopWhite} label={driverLabels.cop} />
                  </div>
                </div>
                {/* Denominator: Land * Volume */}
                <div
                  style={{
                    height: "2px",
                    background: "#00565b",
                    width: "100%",
                    margin: "12px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "16px",
                    padding: "4px",
                  }}
                >
                  <IconBox icon={LandIcon} label={driverLabels.land} />
                  <RowSeparator
                    icon={<CloseOutlined style={{ fontSize: "14px" }} />}
                  />
                  <IconBox icon={VolumeWhite} label={driverLabels.volume} />
                </div>
              </div>
            </div>
          );
        case "volume":
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                {/* Numerator: ExpandedIncome + (Land * COP) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "20px",
                    padding: "8px",
                  }}
                >
                  <ExpandedIncome />
                  <RowSeparator icon={<PlusOutlined />} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "16px",
                      padding: "4px",
                    }}
                  >
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                    <RowSeparator
                      icon={<CloseOutlined style={{ fontSize: "14px" }} />}
                    />
                    <IconBox icon={CopWhite} label={driverLabels.cop} />
                  </div>
                </div>
                {/* Denominator: Land * Price */}
                <div
                  style={{
                    height: "2px",
                    background: "#00565b",
                    width: "100%",
                    margin: "12px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "16px",
                    padding: "4px",
                  }}
                >
                  <IconBox icon={LandIcon} label={driverLabels.land} />
                  <RowSeparator
                    icon={<CloseOutlined style={{ fontSize: "14px" }} />}
                  />
                  <IconBox icon={PriceWhite} label={driverLabels.price} />
                </div>
              </div>
            </div>
          );
        case "cop":
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* (Price * Volume) - (ExpandedIncome / Land) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px dashed #d9d9d9",
                  borderRadius: "16px",
                  padding: "4px",
                }}
              >
                <IconBox icon={PriceWhite} label={driverLabels.price} />
                <RowSeparator
                  icon={<CloseOutlined style={{ fontSize: "14px" }} />}
                />
                <IconBox icon={VolumeWhite} label={driverLabels.volume} />
              </div>
              <RowSeparator icon={<MinusOutlined />} />
              <div style={{ textAlign: "center" }}>
                <ExpandedIncome />
                <div
                  style={{
                    height: "2px",
                    background: "#00565b",
                    width: "100%",
                    margin: "4px 0",
                  }}
                />
                <IconBox icon={LandIcon} label={driverLabels.land} />
              </div>
            </div>
          );
        default:
          return null;
      }
    }
  };

  return (
    <div
      className="equation-visualizer-graphic"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        overflowX: "auto",
        padding: "20px 0",
        minHeight: "450px", // Increased for expanded formulas
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "0 auto",
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
                margin: "0 24px",
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
