import React from "react";
import "./landingcomp.scss";
import { Row, Col, Image, Collapse, Space } from "antd";
import { DriverCalculationStroke } from "../../../lib/icon";
import LandAreaIcon from "../../../assets/icons/land.png";
import VolumeIcon from "../../../assets/icons/volume.png";
import PriceIcon from "../../../assets/icons/price.png";
import CostProductionIcon from "../../../assets/icons/cost-of-production.png";
import DiversifiedIncomeIcon from "../../../assets/icons/diversified-income.png";
import HouseholdIncomeIcon from "../../../assets/icons/hh-income.png";
import TheFrameworkDrivers from "../../../assets/images/the-framework-drivers.png";
import { useWindowDimensions } from "../../../hooks";

const showDriverInfo = false;
const showOldCalculation = false;
const items = [
  {
    key: "1",
    label: "Land",
    children: <p>The size of the land used to grow the crops.</p>,
  },
  {
    key: "2",
    label: "Volume",
    children: (
      <p>
        The volume of produce available for commercial sale, taking into account
        both yield and potential losses.
      </p>
    ),
  },
  {
    key: "3",
    label: "Price",
    children: (
      <p>
        The farmgate price for the produce which may also include a price
        premiums.
      </p>
    ),
  },
  {
    key: "4",
    label: "Cost of Production",
    children: (
      <p>
        The costs of production for producing the primary Crop which covers all
        can cover several types of costs, such as costs for labour, inputs or
        equipment.
      </p>
    ),
  },
  {
    key: "5",
    label: "Diversified Income",
    children: (
      <p>
        The majority of farmer households also earn an income from other sources
        than the primary commodity. This can be income from other crops,
        livestock, income earned from off-farm labour or non-farm non labour
        sources (e.g. remittances, government transfers).
      </p>
    ),
  },
];

const FrameworkDrivers = () => {
  const { isMobile } = useWindowDimensions();

  return (
    <Row
      id="framework-drivers"
      data-testid="framework-drivers-wrapper"
      justify="center"
      className={isMobile ? "mobile-screen" : ""}
    >
      <Col span={24} className="text-wrapper">
        <h2 data-testid="framework-drivers-title">
          The framework
          <br />
          consist of five drivers
        </h2>
        {showDriverInfo && (
          <Collapse accordion items={items} bordered={false} ghost />
        )}
      </Col>
      <Col
        span={24}
        className="framework-drivers-calculation-wrapper"
        align="center"
      >
        <Image
          src={TheFrameworkDrivers}
          preview={false}
          className="framework-drivers-image"
        />
        {showOldCalculation && (
          <div>
            <Space align="center" size={[20, 20]}>
              <Space direction="vertical" align="center">
                <div className="driver-icon-wrapper land-area-icon">
                  <Image src={LandAreaIcon} preview={false} />
                </div>
                <div className="driver-label">Land</div>
              </Space>
              <div className="math-symbol">x</div>
              <Space direction="vertical" align="center">
                <div className="driver-icon-wrapper volume-icon">
                  <Image src={VolumeIcon} preview={false} />
                </div>
                <div className="driver-label">Volume</div>
              </Space>
              <div className="math-symbol">x</div>
              <Space direction="vertical" align="center">
                <div className="driver-icon-wrapper price-icon">
                  <Image src={PriceIcon} preview={false} />
                </div>
                <div className="driver-label">Price</div>
              </Space>
              <div className="math-symbol">-</div>
              <Space direction="vertical" align="center">
                <div className="driver-icon-wrapper cost-production-icon">
                  <Image src={CostProductionIcon} preview={false} />
                </div>
                <div className="driver-label">Cost of production</div>
              </Space>
              <div className="math-symbol">+</div>
              <Space direction="vertical" align="center">
                <div className="driver-icon-wrapper diversified-income-icon">
                  <Image src={DiversifiedIncomeIcon} preview={false} />
                </div>
                <div className="driver-label">Diversified income</div>
              </Space>
              <div className="math-symbol">=</div>
              <Space direction="vertical" align="center">
                <div className="driver-icon-wrapper household-income-icon">
                  <Image src={HouseholdIncomeIcon} preview={false} />
                </div>
                <div className="driver-label">Household Income</div>
              </Space>
            </Space>
            <div className="driver-calculation-stroke">
              <Space direction="vertical" align="center">
                <DriverCalculationStroke />
                <div className="driver-label">Primary Crop</div>
              </Space>
            </div>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default FrameworkDrivers;
