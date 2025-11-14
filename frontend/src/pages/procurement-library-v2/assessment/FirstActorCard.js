import React, { useEffect, useMemo, useState } from "react";
import { Card, Button, Space, Tag } from "antd";
import "./assessment.scss";
import ActorEmptyResult from "./ActorEmptyResult";
import { FIRST_ACTOR_CONTENT } from "../assessment-contents/first-actor-contents";
import {
  VALUE_CHAIN_ACTOR_ORDERS,
  SOURCING_STRATEGY_CYCLE_COLORS,
  SEARCHBOX_ICONS,
  PROCUREMENT_CATEGORIES_ID,
} from "../config";
import CircleCheckIcon from "../../../assets/icons/procurement-library/check-circle.png";
import SourcingStrategyCycleImage from "../../../assets/images/procurement-library/sourcing-strategy-cycle.png";
import { Link } from "react-router-dom";
import { api } from "../../../lib";
import { PLState } from "../../../store";
import { orderBy } from "lodash";
import { ImpactAreaIcons } from "../components";
import { ArrowRightOutlined } from "@ant-design/icons";

const cardGridFullWidthProps = {
  style: {
    width: "100%",
  },
  hoverable: false,
};

const cardGridHalfWidthProps = {
  style: {
    width: "50%",
  },
  hoverable: false,
};

const PRACTICE_LIMIT = 1;

const FirstActorCard = ({
  currentStep,
  setCurrentStep,
  valueChainActorAttributes,
}) => {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(false);
  const categoryWithAttributes = PLState.useState(
    (s) => s.categoryWithAttributes
  );

  const activeFirstActor = useMemo(() => {
    if (!currentStep?.length) {
      return null;
    }
    const first = currentStep[0];
    const actor = VALUE_CHAIN_ACTOR_ORDERS[first];
    return {
      actor,
      content: FIRST_ACTOR_CONTENT?.[actor],
    };
  }, [currentStep]);

  const sourcingStragegyCycleOptions = useMemo(
    () =>
      categoryWithAttributes
        .find(
          (attr) =>
            attr.id === PROCUREMENT_CATEGORIES_ID.sourcing_strategy_cycle
        )
        ?.attributes?.map((it) => ({ label: it.label, value: it.id })),
    [categoryWithAttributes]
  );

  const content = activeFirstActor?.content || null;

  useEffect(() => {
    if (currentStep?.length === 1) {
      const first = currentStep[0];
      const actorId = valueChainActorAttributes?.[first]?.id || null;

      if (actorId && !loading) {
        setLoading(true);
        const urls = orderBy(sourcingStragegyCycleOptions, "value").map(
          ({ value: attributeId }) => {
            const url = `/plv2/practices-by-attribute-ids?attribute_ids=${attributeId}&attribute_ids=${actorId}&limit=${PRACTICE_LIMIT}`;
            return api.get(url);
          }
        );

        Promise.all(urls)
          .then((res) => {
            const [step1, step2, step3, step4] = res;
            setPractices([
              ...step1.data,
              ...step2.data,
              ...step3.data,
              ...step4.data,
            ]);
          })
          .catch((e) => {
            console.error("Error fetching practice for First Actor Card", e);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [
    currentStep,
    loading,
    sourcingStragegyCycleOptions,
    valueChainActorAttributes,
  ]);

  const handleClear = () => {
    setCurrentStep([]);
  };

  return (
    <Card
      title="Individual Actor View"
      className="assesment-results-card"
      extra={
        currentStep?.length >= 1 ? (
          <Button type="ghost" className="clear-button" onClick={handleClear}>
            Clear
          </Button>
        ) : (
          ""
        )
      }
    >
      {content ? (
        <Card className="card-grip-wrapper">
          <Card.Grid {...cardGridFullWidthProps}>
            <div className="fa-result-section-a">
              <Space>
                <img
                  src={content.sectionA.icon}
                  className="fa-section-a-actor-icon"
                />
                <h2>{content.sectionA.title}</h2>
              </Space>
            </div>
            <div className="fa-result-section-b">
              {content.sectionB.list.map((sb, sbix) => {
                if (sb?.list?.length) {
                  return (
                    <div
                      key={`sectionB-${sbix}`}
                      className="fa-result-section-b-list-wrapper"
                    >
                      {sb.list.map((sbl, sbli) => (
                        <Space key={`sbl-${sbli}`} align="top">
                          <img
                            src={CircleCheckIcon}
                            alt={`check-icon-${sbli}`}
                            className="fa-section-b-check-icon"
                          />
                          <p>{sbl?.text || ""}</p>
                        </Space>
                      ))}
                    </div>
                  );
                }
                return <p key={`sectionB-${sbix}`}>{sb?.text || ""}</p>;
              })}
            </div>
          </Card.Grid>

          <Card.Grid {...cardGridHalfWidthProps}>
            <div className="fa-result-section-c">
              <div className="fa-result-section-c-image-wrapper">
                <img src={SourcingStrategyCycleImage} className="sscc-image" />
              </div>
              {content.sectionC.list.map((scl, scli) => (
                <p key={`section-c-list-${scli}`}>{scl}</p>
              ))}
              <Link
                className="button button-green-fill"
                to="/procurement-library#sourcing-strategy-cycle-content"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore the guidance here
              </Link>
            </div>
          </Card.Grid>

          <Card.Grid {...cardGridHalfWidthProps}>
            <div className="fa-result-section-d">
              <div className="fa-result-section-d-content">
                <div className="fa-result-section-d-title-wrapper">
                  <h3>{content.sectionD.title}</h3>
                  <Tag>{practices?.length || 0} results</Tag>
                </div>
                {content.sectionD.list.map((sdl, sdli) => (
                  <p key={`sdl-${sdli}`}>{sdl}</p>
                ))}
                <div className="fa-result-section-d-practices-wrapper">
                  {practices.map((practice, pidx) => {
                    const cardColor = SOURCING_STRATEGY_CYCLE_COLORS[pidx];
                    const cardIcon = SEARCHBOX_ICONS[pidx];
                    return (
                      <div
                        key={`practice-${practice.id}-${pidx}`}
                        className="fa-result-section-d-practice-card"
                        style={{
                          backgroundColor: cardColor.backgroundColor,
                          borderLeft: `2px solid ${cardColor.shadowColor}`,
                        }}
                      >
                        <div className="fa-result-section-d-practice-card-header">
                          <img
                            className="ssc-step"
                            src={cardIcon.icon}
                            alt={cardIcon.name}
                          />
                          <ImpactAreaIcons
                            isIncome={practice?.is_income}
                            isEnv={practice?.is_environmental}
                          />
                        </div>
                        <h4>{practice.label}</h4>
                        <Link
                          className="view-link"
                          to={`/procurement-library/intervention-library/${practice.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View <ArrowRightOutlined />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Link
                className="view-all-link"
                to="/procurement-library/intervention-library"
                target="_blank"
                rel="noopener noreferrer"
              >
                View all <ArrowRightOutlined />
              </Link>
            </div>
          </Card.Grid>
        </Card>
      ) : (
        <ActorEmptyResult title="Please select one value chain actor to explore sustainable procurement" />
      )}
    </Card>
  );
};

export default FirstActorCard;
