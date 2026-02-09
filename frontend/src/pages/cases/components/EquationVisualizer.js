import React from "react";
import {
  ShopOutlined,
  TagOutlined,
  DollarOutlined,
  LineChartOutlined,
  GlobalOutlined,
  CoffeeOutlined,
  PlusOutlined,
  CloseOutlined,
  MinusOutlined,
} from "@ant-design/icons";

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
      }}
    >
      {icon}
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

  const driverIcons = {
    price: <TagOutlined />,
    volume: <ShopOutlined />,
    cop: <CoffeeOutlined />,
    land: <GlobalOutlined />,
  };

  const driverColors = {
    price: "#faad14",
    volume: "#1890ff",
    cop: "#fa8c16",
    land: "#52c41a",
  };

  return (
    <div
      className="equation-visualizer-graphic"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        overflowX: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Numerator & Denominator Group */}
        <div style={{ textAlign: "center" }}>
          {/* Top Row: (Volume x Price) + (Secondary + Diversified - Benchmark) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingBottom: "12px",
            }}
          >
            {selectedDriver !== "volume" && selectedDriver !== "price" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "2px dashed #d9d9d9",
                  borderRadius: "16px",
                  padding: "8px",
                }}
              >
                <IconBox icon={<ShopOutlined />} label="Volume" />
                <RowSeparator
                  icon={<CloseOutlined style={{ fontSize: "16px" }} />}
                />
                <IconBox icon={<TagOutlined />} label="Price" />
              </div>
            )}

            {(selectedDriver === "volume" || selectedDriver === "price") && (
              <IconBox icon={<DollarOutlined />} label="Primary Inc." />
            )}

            <RowSeparator icon={<PlusOutlined />} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "2px dashed #d9d9d9",
                borderRadius: "16px",
                padding: "8px",
              }}
            >
              <IconBox icon={<DollarOutlined />} label="Secondary" />
              <RowSeparator
                icon={<PlusOutlined style={{ fontSize: "16px" }} />}
              />
              <IconBox icon={<CoffeeOutlined />} label="Diversified" />
              <RowSeparator
                icon={<MinusOutlined style={{ fontSize: "16px" }} />}
              />
              <IconBox icon={<LineChartOutlined />} label="Benchmark" />
            </div>
          </div>

          {/* Fraction Line */}
          <div
            style={{
              height: "2px",
              background: "#005a5b",
              width: "100%",
            }}
          />

          {/* Bottom Row: Denominator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "12px",
            }}
          >
            {selectedDriver === "cop" ? (
              <IconBox icon={<GlobalOutlined />} label="Land" />
            ) : selectedDriver === "price" ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                <IconBox icon={<ShopOutlined />} label="Volume" />
                <RowSeparator
                  icon={<CloseOutlined style={{ fontSize: "16px" }} />}
                />
                <IconBox icon={<GlobalOutlined />} label="Land" />
              </div>
            ) : (
              <IconBox icon={<TagOutlined />} label="Price" />
            )}
          </div>
        </div>

        {/* Equals Section */}
        <RowSeparator
          icon={
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginLeft: 16 }}
            >
              =
            </div>
          }
        />

        {/* Result: Target Driver */}
        <div style={{ marginLeft: 16 }}>
          <IconBox
            icon={driverIcons[selectedDriver]}
            label={driverLabels[selectedDriver]}
            color={driverColors[selectedDriver]}
          />
        </div>
      </div>
    </div>
  );
};

export default EquationVisualizer;
