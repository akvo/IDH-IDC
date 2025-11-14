import React, { useMemo } from "react";
import { Card, Button, Space } from "antd";
import "./assessment.scss";
import ActorEmptyResult from "./ActorEmptyResult";
import { VALUE_CHAIN_ACTOR_ORDERS } from "../config";
import { SECOND_ACTOR_CONTENT } from "../assessment-contents/second-actor-contents";
import CircleCheckIcon from "../../../assets/icons/procurement-library/check-circle.png";

const cardGridHalfWidthProps = {
  style: {
    width: "50%",
  },
  hoverable: false,
};

const SecondActorCard = ({ currentStep }) => {
  const activeSecondActorPair = useMemo(() => {
    if (!currentStep?.length || currentStep?.length < 2) {
      return null;
    }
    const pairs = currentStep.map((ix) => VALUE_CHAIN_ACTOR_ORDERS[ix]);
    const actor = pairs.join("_");
    return {
      actor,
      content: SECOND_ACTOR_CONTENT?.[actor],
    };
  }, [currentStep]);

  const content = activeSecondActorPair?.content || null;

  return (
    <Card
      title="Value Chain Relationship View"
      className="assesment-results-card"
      extra={
        currentStep?.length === 2 ? (
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
          <Card.Grid {...cardGridHalfWidthProps}>
            <div className="sa-result-section-a">
              <h2>{content.sectionA.title}</h2>
            </div>
            <div className="sa-result-section-c">
              {content.sectionC.list.map((scl, scli) => {
                if (scl?.list?.length) {
                  return (
                    <div
                      key={`sa-scl-${scli}`}
                      className="sa-result-section-c-list-wrapper"
                    >
                      {scl.list.map((scll, sclli) => (
                        <Space key={`sa-scll-${sclli}`} align="top">
                          <img
                            src={CircleCheckIcon}
                            alt={`check-icon-${sclli}`}
                            className="sa-section-c-check-icon"
                          />
                          <p>{scll}</p>
                        </Space>
                      ))}
                    </div>
                  );
                }
                return <p key={`sa-scl-${scli}`}>{scl.text}</p>;
              })}
            </div>
          </Card.Grid>

          <Card.Grid {...cardGridHalfWidthProps}>
            <div className="sa-result-section-b">
              <h2>{content.sectionB.title}</h2>
            </div>
            <div className="sa-result-section-d">
              {content.sectionD.list.map((sdl, sdli) => {
                if (sdl?.list?.length) {
                  return (
                    <div
                      key={`sa-sdl-${sdli}`}
                      className="sa-result-section-d-list-wrapper"
                    >
                      {sdl.list.map((sdll, sdlli) => {
                        if (sdll?.list?.length) {
                          return (
                            <div
                              key={`sa-sdll-${sdlli}`}
                              className="sa-result-section-d-list-wrapper"
                            >
                              {sdll?.title ? <h4>{sdll.title}</h4> : ""}
                              {sdll.list.map((it, idx) => (
                                <Space key={`sa-sdlll-${idx}`} align="top">
                                  <img
                                    src={CircleCheckIcon}
                                    alt={`check-icon-${idx}`}
                                    className="sa-section-d-check-icon"
                                  />
                                  <p>{it}</p>
                                </Space>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <p key={`sa-sdll-${sdlli}`}>{sdll?.text || ""}</p>
                        );
                      })}
                    </div>
                  );
                }
                return <p key={`sa-scl-${sdli}`}>{sdl.text}</p>;
              })}
            </div>
          </Card.Grid>
        </Card>
      ) : (
        <ActorEmptyResult title="Please select two value chain actors to explore sustainable procurement in this relationship" />
      )}
    </Card>
  );
};

export default SecondActorCard;
