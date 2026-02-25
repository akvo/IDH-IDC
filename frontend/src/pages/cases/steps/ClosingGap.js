import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentCaseState, CaseVisualState, CaseUIState } from "../store";
import { Row, Col, Space, Button, message, Card } from "antd";
import { AdvancedModellingTool } from "../components";
import { isEmpty, isEqual } from "lodash";
import { api, removeUndefinedObjectValue } from "../../../lib";

/**
 * STEP 5
 */

const ClosingGap = ({
  setbackfunction,
  setnextfunction,
  setsavefunction,
  onSave,
}) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const { scenarioModeling, prevScenarioModeling } = CaseVisualState.useState(
    (s) => s
  );
  const { enableEditCase, enableAdvancedTools } = CaseUIState.useState(
    (s) => s.general
  );

  const [messageApi, contextHolder] = message.useMessage();

  const upateCaseButtonState = (value) => {
    CaseUIState.update((s) => ({
      ...s,
      caseButton: value,
    }));
  };

  const handleSaveVisualization = useCallback(
    ({ allowNavigate = false }) => {
      if (!enableEditCase) {
        console.info(allowNavigate);
        return;
      }

      upateCaseButtonState({ loading: true });
      const payloads = [scenarioModeling];
      // scenario modeling
      const isScenarioUpdated = !isEqual(
        removeUndefinedObjectValue(prevScenarioModeling?.config),
        removeUndefinedObjectValue(scenarioModeling?.config)
      );
      // save only when the payloads is provided
      if (!isEmpty(payloads?.[0]?.config) && payloads?.[0]?.case) {
        // Save
        api
          .sendCompressedData(
            `visualization?updated=${isScenarioUpdated}`,
            payloads
          )
          .then(() => {
            CaseVisualState.update((s) => ({
              ...s,
              prevScenarioModeling: {
                ...scenarioModeling,
              },
            }));
            messageApi.open({
              type: "success",
              content: "Scenario modeling value saved successfully.",
            });
          })
          .catch((e) => {
            console.error(e);
            const { status, data } = e.response;
            let errorText = "Failed to save scenario modeling value.";
            if (status === 403) {
              errorText = data.detail;
            }
            messageApi.open({
              type: "error",
              content: errorText,
            });
          })
          .finally(() => {
            upateCaseButtonState({ loading: false });
          });
      } else {
        upateCaseButtonState({ loading: false });
      }
    },
    [enableEditCase, messageApi, prevScenarioModeling, scenarioModeling]
  );

  const backFunction = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const nextFunction = useCallback(() => {
    handleSaveVisualization({ allowNavigate: true });
  }, [handleSaveVisualization]);

  const saveFunction = useCallback(() => {
    handleSaveVisualization({ allowNavigate: false });
  }, [handleSaveVisualization]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
    if (setsavefunction) {
      setsavefunction(saveFunction);
    }
  }, [
    setbackfunction,
    setnextfunction,
    setsavefunction,
    backFunction,
    nextFunction,
    saveFunction,
  ]);

  const handleOnClickComplete = () => {
    handleSaveVisualization({ allowNavigate: false });
    api
      .put(`case/update-status/${currentCase.id}?status=1`)
      .then(() => {
        CurrentCaseState.update((s) => ({
          ...s,
          status: 1,
        }));
        messageApi.open({
          type: "success",
          content: `Case ${currentCase.name} mark as completed.`,
        });
      })
      .catch((e) => {
        console.error(e);
        // const { status, data } = e.response;
        const errorText = "Failed to mark this case as completed.";
        messageApi.open({
          type: "error",
          content: errorText,
        });
      })
      .finally(() => {});
  };

  return (
    <Row id="closing-gap" gutter={[24, 24]}>
      {contextHolder}
      <Col span={24} className="header-wrapper">
        <div>
          <Space direction="vertical">
            <div className="title">Closing the gap</div>
            <div className="description">
              This section enables you to create scenarios and test different
              strategies to close the income gap. By adjusting each income
              driver based on the tailored strategy, it allows you to visualise
              its impact on the income gap for each segment.
            </div>
          </Space>
        </div>
        <div>
          <Button className="button-green-fill" onClick={onSave}>
            Save
          </Button>
        </div>
      </Col>

      <Col span={24}>
        <AdvancedModellingTool
          disabled={!enableEditCase || !enableAdvancedTools}
        />
      </Col>

      {/* Complete Button */}
      <Col span={24}>
        <Card className="complete-button-wrapper">
          <div className="text-wrapper">
            <div className="title">
              You’ve reached the final step of the Income Driver Calculator
            </div>
            <div className="description">
              Would you like to mark this case as complete? Doing so makes it
              easier for others to review and analyse the results at a later
              stage.
            </div>
          </div>
          <div className="button-wrapper">
            <Button
              className="button-complete"
              size="large"
              onClick={handleOnClickComplete}
              disabled={!enableEditCase || !enableAdvancedTools}
            >
              Mark as complete
            </Button>
          </div>
        </Card>
      </Col>
      {/* EOL Complete Button */}
    </Row>
  );
};

export default ClosingGap;
