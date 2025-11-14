import React, { useState, useMemo } from "react";
import { Breadcrumb, Steps, Checkbox, Radio } from "antd";
import { Link } from "react-router-dom";
import "./assessment.scss";
import { Blocker } from "../../../components/utils";
import { useWindowDimensions } from "../../../hooks";
import ComingSoonCard from "./ComingSoonCard";
import { HomeOutlined, RightOutlined } from "@ant-design/icons";
import { PLState } from "../../../store";
import {
  PROCUREMENT_CATEGORIES_ID,
  VALUE_CHAIN_ACTOR_ORDERS,
  VALUE_CHAIN_ACTOR_ICONS,
} from "../config";
import { uniq } from "lodash";
import FooterDisclaimer from "../../income-driver-calculator/components/FooterDisclaimer";
import FirstActorCard from "./FirstActorCard";
import SecondActorCard from "./SecondActorCard";

const isComingSoon = false;
const breadcrumbItems = [
  {
    key: "/home",
    title: "Home",
    active: false,
  },
  { key: "/procurement-library", title: "Procurement Library", active: false },
  {
    key: "/procurement-library/assesment",
    title: "Procurement Practices",
    active: true,
  },
];

const Assessment = () => {
  const { isMobile } = useWindowDimensions();
  const categoryWithAttributes = PLState.useState(
    (s) => s.categoryWithAttributes
  );

  const [currentStep, setCurrentStep] = useState([]);
  const [farmerActorSelected, setFarmerActorSelected] = useState(false);

  const valueChainActorAttributes = useMemo(() => {
    const res =
      categoryWithAttributes.find(
        (c) => c.id === PROCUREMENT_CATEGORIES_ID.value_chain_actor
      )?.attributes || [];
    return VALUE_CHAIN_ACTOR_ORDERS.map((od) => {
      const find = res.find((r) => r.label.toLowerCase().includes(od));
      return {
        ...find,
        icon: VALUE_CHAIN_ACTOR_ICONS?.[od] || "",
      };
    });
  }, [categoryWithAttributes]);

  const handleOnChangeStep = (idx) => {
    // *If exploring the Farmer perspective first, a second actor cannot be selected.
    if (!currentStep?.length && idx === 0) {
      setFarmerActorSelected(true);
    } else {
      setFarmerActorSelected(false);
    }
    // * eol

    if (currentStep?.includes(idx)) {
      setCurrentStep((prev) => uniq(prev.filter((val) => val !== idx)));
    } else {
      setCurrentStep((prev) => uniq([...prev, idx]));
    }
  };

  const customDot = (dot, item) => (
    <Radio checked={currentStep?.includes(item.index)} />
  );

  if (isComingSoon) {
    return <ComingSoonCard />;
  }

  if (isMobile) {
    return <Blocker backRoute="/procurement-library" />;
  }

  return (
    <div id="assessment-page">
      <div className="assessment-container">
        {/* Header */}
        <div className="assesment-header">
          <div className="breadcrumb-wrapper">
            <Breadcrumb
              separator={<RightOutlined />}
              items={breadcrumbItems.map((x, bi) => ({
                key: bi,
                title: (
                  <Link to={x.key} className={x.active ? "active" : ""}>
                    {x?.title?.toLowerCase() === "home" ? (
                      <HomeOutlined style={{ fontSize: "16px" }} />
                    ) : (
                      x.title
                    )}
                  </Link>
                ),
              }))}
            />
          </div>
          <div className="assesment-title-card-wrapper">
            <div className="assesment-title-text-wrapper">
              <h1>
                Serious about sustainable procurement and curious to learn more?
              </h1>
              <p>
                Discover the procurement practices that fit your situation and
                help you achieve your desired impact. Use the value chain below
                to explore how to start thinking about and implementing
                sustainable procurement for your business.
              </p>
            </div>
          </div>
        </div>
        {/* EOL Header */}

        {/* Content */}
        <div className="assesment-content">
          <div className="assesment-content-intro">
            <p>
              Select one actor* in this value chain that most represents your
              business, or part of your business, to explore how to start
              approaching sustainable procurement.
            </p>
            <p>
              You can then choose to select a second actor to explore what
              sustainable procurement could mean for the relationship between
              your business and this other actor.
            </p>
          </div>
          <div className="value-chain-actor-card">
            <Steps
              progressDot={customDot}
              onChange={handleOnChangeStep}
              current={currentStep}
              items={valueChainActorAttributes.map((val, idx) => ({
                title: (
                  <div className="value-chain-actor-item-card">
                    <div className="vca-icon-wrapper">
                      <img
                        src={val?.icon}
                        alt={val?.label}
                        className="vca-item-icon"
                      />
                      <Checkbox checked={currentStep?.includes(idx)} />
                    </div>
                    <p>{val?.label}</p>
                  </div>
                ),
                disabled: farmerActorSelected
                  ? !currentStep?.includes(idx)
                  : !currentStep?.includes(idx) && currentStep?.length === 2,
                status: currentStep?.includes(idx) ? "process" : "wait",
              }))}
            />
          </div>
          <div className="assesment-hint-wrapper">
            <p>
              *If exploring the Farmer perspective first, a second actor cannot
              be selected.
            </p>
          </div>
        </div>
        {/* EOL Content */}

        {/* Result */}
        <div className="assesment-results">
          {/* Result 1 */}
          <FirstActorCard
            currentStep={currentStep}
            valueChainActorAttributes={valueChainActorAttributes}
            setCurrentStep={setCurrentStep}
          />
          {/* EOL Result 1 */}

          {/* Result 2 */}
          <SecondActorCard
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
          {/* EOL Result 2 */}
        </div>
        {/* EOL Result */}
      </div>

      <FooterDisclaimer disclaimerText="procurement" />
    </div>
  );
};

export default Assessment;
