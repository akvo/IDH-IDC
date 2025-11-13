import React from "react";
import { Card, Button } from "antd";
import "./assessment.scss";
import ActorEmptyResult from "./ActorEmptyResult";

const SecondActorCard = ({ currentStep }) => {
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
      <ActorEmptyResult title="Please select two value chain actors to explore sustainable procurement in this relationship" />
    </Card>
  );
};

export default SecondActorCard;
