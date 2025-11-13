import React from "react";
import { Card, Button } from "antd";
import "./assessment.scss";
import ActorEmptyResult from "./ActorEmptyResult";
import { FIRST_ACTOR } from "../first-actor-contents";

const FirstActorCard = ({ currentStep }) => {
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
      <ActorEmptyResult title="Please select one value chain actor to explore sustainable procurement" />
    </Card>
  );
};

export default FirstActorCard;
