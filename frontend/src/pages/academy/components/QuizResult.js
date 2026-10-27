import React, { useState } from "react";
import { Typography, Button, Progress, Card, Result, Divider } from "antd";
import { TrophyOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

/**
 * QuizResult component handles the post-quiz experience, showing both
 * the summary score and the detailed answer review.
 *
 * @param {Object} quizResult - Result object from react-quiz-component
 * @param {Object} quiz - Original quiz metadata with questions and explanations
 * @param {Function} onNext - Callback for proceeding to the next chapter/finish
 * @param {Function} onRetry - Callback for restarting the quiz
 * @param {Boolean} isLastChapter - Whether this is the final chapter of the course
 */
const QuizResult = ({ quizResult, quiz, onNext, onRetry, isLastChapter }) => {
  const [showSummary, setShowSummary] = useState(false);

  if (!quizResult) {
    return null;
  }

  if (showSummary) {
    return (
      <Card className="quiz-summary-card animate-fade-in">
        <div className="summary-header">
          <Title level={3} style={{ color: "#1B625F", margin: 0 }}>
            Review Assessment
          </Title>
          <Button onClick={() => setShowSummary(false)}>Back to Results</Button>
        </div>
        <Divider />
        <div className="summary-list">
          {quiz.questions.map((q, idx) => {
            const userChoiceIndex = quizResult.userInput[idx];
            const isCorrect = userChoiceIndex + 1 === parseInt(q.correctAnswer);

            return (
              <div key={idx} className="summary-item">
                <div className="question-header">
                  <div
                    className={`status-dot ${
                      isCorrect ? "correct" : "incorrect"
                    }`}
                  />
                  <Text strong className="question-text">
                    {idx + 1}. {q.question}
                  </Text>
                </div>

                <div className="answer-comparison">
                  <div className="answer-row">
                    <Text type="secondary">Your Answer: </Text>
                    <Text
                      className={isCorrect ? "txt-correct" : "txt-incorrect"}
                    >
                      {q.answers[userChoiceIndex] || "No Answer"}
                    </Text>
                  </div>
                  {!isCorrect && (
                    <div className="answer-row">
                      <Text type="secondary">Correct Answer: </Text>
                      <Text className="txt-correct">
                        {q.answers[parseInt(q.correctAnswer) - 1]}
                      </Text>
                    </div>
                  )}
                </div>

                {q.explanation && (
                  <div className="explanation-box">
                    <Text strong style={{ fontSize: "12px" }}>
                      EXPLANATION:
                    </Text>
                    <Paragraph
                      className="explanation-text"
                      style={{ marginTop: "4px" }}
                    >
                      {q.explanation}
                    </Paragraph>
                  </div>
                )}
                {idx < quiz.questions.length - 1 && <Divider dashed />}
              </div>
            );
          })}
        </div>
        <Divider />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button type="primary" size="large" onClick={onRetry}>
            Retry Assessment
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="quiz-result-card animate-scale-in">
      <Result
        icon={<TrophyOutlined style={{ color: "#FFD700", fontSize: "4rem" }} />}
        title={
          <Title level={2} style={{ color: "#1B625F" }}>
            Assessment Complete!
          </Title>
        }
        subTitle={
          <div className="result-stats">
            <Text strong size="large">
              You scored {quizResult.numberOfCorrectAnswers} out of{" "}
              {quizResult.numberOfQuestions}
            </Text>
            <br />
            <Progress
              percent={Math.round(
                (quizResult.numberOfCorrectAnswers /
                  quizResult.numberOfQuestions) *
                  100
              )}
              strokeColor="#1B625F"
              type="circle"
              style={{ marginTop: "24px" }}
            />
          </div>
        }
        extra={[
          <Button
            type="primary"
            key="next"
            size="large"
            className="btn-next-module"
            onClick={onNext}
          >
            {isLastChapter ? "Finish Academy Course" : "Proceed to Next Module"}
          </Button>,
          <Button
            key="review"
            size="large"
            onClick={() => setShowSummary(true)}
            style={{ marginTop: "12px" }}
          >
            Review Answers
          </Button>,
          <Button key="retry" onClick={onRetry} style={{ marginTop: "12px" }}>
            Retry Assessment
          </Button>,
        ]}
      />
    </Card>
  );
};

export default QuizResult;
