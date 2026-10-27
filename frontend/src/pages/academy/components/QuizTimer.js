import React, { useState, useEffect } from "react";
import { Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const QuizTimer = ({ initialMinutes, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? "0" : ""}${rs}`;
  };

  return (
    <div className="quiz-timer-floating">
      <ClockCircleOutlined style={{ color: "#1B625F", marginRight: "8px" }} />
      <Text strong style={{ color: "#1B625F" }}>
        {formatTime(secondsLeft)}
      </Text>
    </div>
  );
};

export default QuizTimer;
