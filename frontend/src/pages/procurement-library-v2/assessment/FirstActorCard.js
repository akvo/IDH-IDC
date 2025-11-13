import React, { useMemo } from "react";
import { Card, Button, Space, Tag } from "antd";
import "./assessment.scss";
import ActorEmptyResult from "./ActorEmptyResult";
import { FIRST_ACTOR } from "../first-actor-contents";
import { VALUE_CHAIN_ACTOR_ORDERS } from "../config";
import CircleCheckIcon from "../../../assets/icons/procurement-library/check-circle.png";
import SourcingStrategyCycleImage from "../../../assets/images/procurement-library/sourcing-strategy-cycle.png";
import { Link } from "react-router-dom";

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

const FirstActorCard = ({ currentStep }) => {
  const activeFirstActor = useMemo(() => {
    if (!currentStep?.length) {
      return null;
    }
    const first = currentStep[0];
    const actor = VALUE_CHAIN_ACTOR_ORDERS[first];
    return {
      actor,
      content: FIRST_ACTOR?.[actor],
    };
  }, [currentStep]);

  const content = activeFirstActor?.content || null;

  return (
    <Card
      title="Individual Actor View"
      className="assesment-results-card"
      extra={
        currentStep?.length >= 1 ? (
          <Button type="ghost" className="clear-button">
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
              >
                Explore the guidance here
              </Link>
            </div>
          </Card.Grid>

          <Card.Grid {...cardGridHalfWidthProps}>
            <div className="fa-result-section-d">
              <div className="fa-result-section-d-title-wrapper">
                <h3>{content.sectionD.title}</h3>
                <Tag>3 results</Tag>
              </div>
              {content.sectionD.list.map((sdl, sdli) => (
                <p key={`sdl-${sdli}`}>{sdl}</p>
              ))}
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
