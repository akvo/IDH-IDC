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
  <div className="icon-box-container">
    <div className="icon-circle" style={{ background: color }}>
      {typeof icon === "string" ? <img src={icon} alt={label} /> : icon}
    </div>
    <div className="icon-label">{label}</div>
  </div>
);

const RowSeparator = ({ icon, color = "#595959" }) => (
  <div className="row-separator" style={{ color: color }}>
    {icon}
  </div>
);

const EquationVisualizer = ({
  selectedDriver = "cop",
  labels = {},
  category = "Crop",
  secondaryLabel = "Secondary commodity",
  tertiaryLabel = "Tertiary commodity",
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

  // Helper Segment: Expanded Target Income (Benchmark - Secondary - Tertiary - Diversified)
  const ExpandedIncome = () => (
    <div className="expanded-income-container">
      <IconBox icon={BenchmarkIcon} label="Benchmark" />
      {secondaryLabel && (
        <>
          <RowSeparator icon={<MinusOutlined className="icon-14" />} />
          <IconBox icon={IncomeWhite} label="Secondary Income" />
        </>
      )}
      {tertiaryLabel && (
        <>
          <RowSeparator icon={<MinusOutlined className="icon-14" />} />
          <IconBox icon={IncomeWhite} label="Tertiary Income" />
        </>
      )}
      <RowSeparator icon={<MinusOutlined className="icon-14" />} />
      <IconBox icon={DiversifiedIcon} label="Other Diversified Income" />
    </div>
  );

  const renderFormulaContent = () => {
    if (isAquaculture) {
      switch (selectedDriver) {
        case "price":
          return (
            <div className="flex-center">
              <div className="formula-center-wrapper">
                {/* Numerator: (ExpandedIncome / Land) - 1 */}
                <div className="formula-group-dashed">
                  <div className="formula-center-wrapper">
                    <ExpandedIncome />
                    <div className="fraction-line" />
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                  </div>
                  <RowSeparator icon={<MinusOutlined className="icon-14" />} />
                  <div className="text-number-large">1</div>
                </div>
                {/* Divide by Volume */}
                <div className="fraction-line large-margin" />
                <IconBox icon={VolumeWhite} label={driverLabels.volume} />
              </div>
              <RowSeparator icon={<PlusOutlined />} />
              <IconBox icon={CopWhite} label={driverLabels.cop} />
            </div>
          );
        case "volume":
          return (
            <div className="flex-center">
              <div className="formula-center-wrapper">
                {/* Numerator: (ExpandedIncome / Land) - 1 */}
                <div className="formula-group-dashed">
                  <div className="formula-center-wrapper">
                    <ExpandedIncome />
                    <div className="fraction-line" />
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                  </div>
                  <RowSeparator icon={<MinusOutlined className="icon-14" />} />
                  <div className="text-number-large">1</div>
                </div>
                {/* Divide by (Price - COP) */}
                <div className="fraction-line large-margin" />
                <div className="formula-group-dashed small-radius">
                  <IconBox icon={PriceWhite} label={driverLabels.price} />
                  <RowSeparator icon={<MinusOutlined className="icon-14" />} />
                  <IconBox icon={CopWhite} label={driverLabels.cop} />
                </div>
              </div>
            </div>
          );
        case "cop":
          return (
            <div className="flex-center">
              <IconBox icon={PriceWhite} label={driverLabels.price} />
              <RowSeparator icon={<MinusOutlined />} />
              <div className="formula-center-wrapper">
                {/* ((ExpandedIncome / Land) - 1) / Volume */}
                <div className="formula-group-dashed">
                  <div className="formula-center-wrapper">
                    <ExpandedIncome />
                    <div className="fraction-line" />
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                  </div>
                  <RowSeparator icon={<MinusOutlined className="icon-14" />} />
                  <div className="text-number-large">1</div>
                </div>
                <div className="fraction-line large-margin" />
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
            <div className="flex-center">
              <div className="formula-center-wrapper">
                {/* Numerator: ExpandedIncome + (Land * COP) */}
                <div className="formula-group-dashed">
                  <ExpandedIncome />
                  <RowSeparator icon={<PlusOutlined />} />
                  <div className="formula-group-dashed small-radius">
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                    <RowSeparator
                      icon={<CloseOutlined className="icon-14" />}
                    />
                    <IconBox icon={CopWhite} label={driverLabels.cop} />
                  </div>
                </div>
                {/* Denominator: Land * Volume */}
                <div className="fraction-line large-margin" />
                <div className="formula-group-dashed small-radius">
                  <IconBox icon={LandIcon} label={driverLabels.land} />
                  <RowSeparator icon={<CloseOutlined className="icon-14" />} />
                  <IconBox icon={VolumeWhite} label={driverLabels.volume} />
                </div>
              </div>
            </div>
          );
        case "volume":
          return (
            <div className="flex-center">
              <div className="formula-center-wrapper">
                {/* Numerator: ExpandedIncome + (Land * COP) */}
                <div className="formula-group-dashed">
                  <ExpandedIncome />
                  <RowSeparator icon={<PlusOutlined />} />
                  <div className="formula-group-dashed small-radius">
                    <IconBox icon={LandIcon} label={driverLabels.land} />
                    <RowSeparator
                      icon={<CloseOutlined className="icon-14" />}
                    />
                    <IconBox icon={CopWhite} label={driverLabels.cop} />
                  </div>
                </div>
                {/* Denominator: Land * Price */}
                <div className="fraction-line large-margin" />
                <div className="formula-group-dashed small-radius">
                  <IconBox icon={LandIcon} label={driverLabels.land} />
                  <RowSeparator icon={<CloseOutlined className="icon-14" />} />
                  <IconBox icon={PriceWhite} label={driverLabels.price} />
                </div>
              </div>
            </div>
          );
        case "cop":
          return (
            <div className="flex-center">
              {/* (Price * Volume) - (ExpandedIncome / Land) */}
              <div className="formula-group-dashed small-radius">
                <IconBox icon={PriceWhite} label={driverLabels.price} />
                <RowSeparator icon={<CloseOutlined className="icon-14" />} />
                <IconBox icon={VolumeWhite} label={driverLabels.volume} />
              </div>
              <RowSeparator icon={<MinusOutlined />} />
              <div className="formula-center-wrapper">
                <ExpandedIncome />
                <div className="fraction-line" />
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
    <div className="equation-visualizer-graphic">
      <div className="equation-content-inner">
        {renderFormulaContent()}

        {/* Equals Section */}
        <RowSeparator
          icon={<div className="equals-operator">=</div>}
          color="#00565b"
        />

        {/* Result: Target Driver */}
        <div className="formula-center-wrapper">
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
