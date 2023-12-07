import React from "react";
import "./landingcomp.scss";
import { Row, Col, Image, Collapse, Space } from "antd";
import {
  LandAreaIcon,
  VolumeIcon,
  PriceIcon,
  CostProductionIcon,
  DiversifiedIncomeIcon,
  HouseholdIncomeIcon,
  DriverCalculationStroke,
} from "../../../lib/icon";
import LoginRightImage from "../../../assets/images/login-right-img.png";

const FrameworkDrivers = () => {
  const items = [
    {
      key: "1",
      label: "Land Area",
      children: <p>The size of the area used to grow the focus commodity.</p>,
    },
    {
      key: "2",
      label: "Volume",
      children: (
        <p>
          The quantity per unit area, taking into account both yield and
          potential loss.
        </p>
      ),
    },
    {
      key: "3",
      label: "Price",
      children: (
        <p>
          The price per unit of the focus commodity, which may also include a
          price premium.
        </p>
      ),
    },
    {
      key: "4",
      label: "Cost of Production",
      children: (
        <p>
          The costs of production for growing the focus commodity can cover
          several types of costs, such as costs for labour, inputs or equipment.
        </p>
      ),
    },
    {
      key: "5",
      label: "Diversified Income",
      children: (
        <p>
          The majority of farmer’ households also earn an income from other
          sources than the focus commodity. This can be income from other crops,
          livestock, income earned from off-farm labour or non-farm non labour
          sources (e.g. remittances, government transfers).
        </p>
      ),
    },
  ];

  return (
    <Row
      id="framework-drivers"
      data-testid="framework-drivers-wrapper"
      justify="center"
    >
      <Col span={12} className="text-wrapper">
        <h2 data-testid="framework-drivers-title">
          The framework consists of five drivers
        </h2>
        <Collapse accordion items={items} bordered={false} ghost />
      </Col>
      <Col
        span={12}
        data-testid="framework-drivers-image"
        className="image-wrapper"
      >
        <Image className="image" src={LoginRightImage} preview={false} />
      </Col>
      <div className="framework-drivers-calculation-wrapper">
        <Space align="center" size={[20, 20]}>
          <Space direction="vertical" align="center">
            <div className="driver-icon-wrapper land-area-icon">
              <LandAreaIcon />
            </div>
            <div className="driver-label">Land area</div>
          </Space>
          <div className="math-symbol">x</div>
          <Space direction="vertical" align="center">
            <div className="driver-icon-wrapper volume-icon">
              <VolumeIcon />
            </div>
            <div className="driver-label">Volume</div>
          </Space>
          <div className="math-symbol">x</div>
          <Space direction="vertical" align="center">
            <div className="driver-icon-wrapper price-icon">
              <PriceIcon />
            </div>
            <div className="driver-label">Price</div>
          </Space>
          <div className="math-symbol">-</div>
          <Space direction="vertical" align="center">
            <div className="driver-icon-wrapper cost-production-icon">
              <CostProductionIcon />
            </div>
            <div className="driver-label">Cost of production</div>
          </Space>
          <div className="math-symbol">+</div>
          <Space direction="vertical" align="center">
            <div className="driver-icon-wrapper diversified-income-icon">
              <DiversifiedIncomeIcon />
            </div>
            <div className="driver-label">Diversified income</div>
          </Space>
          <div className="math-symbol">=</div>
          <Space direction="vertical" align="center">
            <div className="driver-icon-wrapper household-income-icon">
              <HouseholdIncomeIcon />
            </div>
            <div className="driver-label">Household Income</div>
          </Space>
        </Space>
        <div className="driver-calculation-stroke">
          <DriverCalculationStroke />
        </div>
      </div>
    </Row>
  );
};

export default FrameworkDrivers;
