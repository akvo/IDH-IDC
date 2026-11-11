import React from "react";
import { Tooltip, message } from "antd";

const defaultOnClick = () =>
  message.info("The Academy facilitator chat is coming soon.");

// Figma blob shape used as the button background
const BlobBackground = () => (
  <svg
    className="academy-chatbot-blob"
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M23.9178 47.7421C14.4554 49.1221 4.56517 44.982 1.3887 34.5145C-2.2713 22.6708 1.25852 7.2523 12.5101 1.86978C26.3095 -4.46128 45.1116 6.02849 47.8231 22.15C49.735 36.7167 35.7756 46.5703 23.9215 47.7383"
      fill="#005EA3"
    />
  </svg>
);

// Plain round speech-bubble outline, as in the Figma design
const ChatIcon = () => (
  <svg
    className="academy-chatbot-icon"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

const ChatbotFloatButton = ({ onClick = defaultOnClick }) => (
  <Tooltip title="Ask the Academy facilitator" placement="left">
    <button
      type="button"
      aria-label="Open Academy facilitator chat"
      className="academy-chatbot-button"
      data-testid="academy-chatbot-button"
      onClick={onClick}
    >
      <BlobBackground />
      <ChatIcon />
    </button>
  </Tooltip>
);

export default ChatbotFloatButton;
