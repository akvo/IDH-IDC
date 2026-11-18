import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { message } from "antd";
import { initChat } from "akvo-rag-js";
import AcademyChatbot from "../AcademyChatbot";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("akvo-rag-js", () => ({
  initChat: jest.fn(),
}));

describe("AcademyChatbot", () => {
  let mockChatInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChatInstance = {
      open: jest.fn(),
      close: jest.fn(),
      destroy: jest.fn(),
    };

    initChat.mockImplementation(() => mockChatInstance);

    const existing = document.getElementById("akvo-rag");
    if (existing) {
      existing.remove();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    const existing = document.getElementById("akvo-rag");
    if (existing) {
      existing.remove();
    }
  });

  it("renders the floating button and shows coming soon notice when unconfigured", () => {
    const infoSpy = jest.spyOn(message, "info").mockImplementation(() => {});

    render(<AcademyChatbot wsUrl={null} kbId={null} />);

    const button = screen.getByTestId("academy-chatbot-button");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(infoSpy).toHaveBeenCalledWith(
      "The Academy facilitator chat is coming soon."
    );
    expect(initChat).not.toHaveBeenCalled();
  });

  it("initializes akvo-rag-js with configured options when wsUrl and kbId are set", () => {
    const { unmount } = render(
      <AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />
    );

    expect(initChat).toHaveBeenCalledWith({
      ws_url: "wss://test-rag.org/ws/chat",
      kb_id: 753,
      botName: "Living Income AI",
      primaryColor: "#007A78",
      startMinimized: true,
      showLauncher: false,
    });

    unmount();
    expect(mockChatInstance.destroy).toHaveBeenCalled();
  });

  it("toggles chat window open and closed when the button is clicked", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const button = screen.getByTestId("academy-chatbot-button");

    // First click: opens chat
    fireEvent.click(button);
    expect(mockChatInstance.open).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("academy-chatbot-wrapper")).toHaveClass(
      "academy-chatbot-open"
    );

    // Second click: closes chat
    fireEvent.click(button);
    expect(mockChatInstance.close).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("academy-chatbot-wrapper")).not.toHaveClass(
      "academy-chatbot-open"
    );
  });

  it("closes the chat when clicking the header close button (#akvo-rag-close-btn)", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    // Open first
    const button = screen.getByTestId("academy-chatbot-button");
    fireEvent.click(button);
    expect(screen.getByTestId("academy-chatbot-wrapper")).toHaveClass(
      "academy-chatbot-open"
    );

    // Create mock DOM for #akvo-rag with #akvo-rag-close-btn
    const container = document.createElement("div");
    container.id = "akvo-rag";
    const closeBtn = document.createElement("button");
    closeBtn.id = "akvo-rag-close-btn";
    container.appendChild(closeBtn);
    document.body.appendChild(container);

    fireEvent.click(closeBtn);
    expect(screen.getByTestId("academy-chatbot-wrapper")).not.toHaveClass(
      "academy-chatbot-open"
    );
  });

  it("intercepts /academy links clicked inside #akvo-rag and navigates via React Router", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const container = document.createElement("div");
    container.id = "akvo-rag";
    const link = document.createElement("a");
    link.href = "/academy/modules/1?chapter=2";
    link.setAttribute("href", "/academy/modules/1?chapter=2");
    link.textContent = "Go to Chapter 2";
    container.appendChild(link);
    document.body.appendChild(container);

    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/1?chapter=2");
  });

  it("detects module-chapter filename patterns in citation anchors and deep-links", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const container = document.createElement("div");
    container.id = "akvo-rag";
    const link = document.createElement("a");
    link.setAttribute("href", "#");
    link.textContent = "Source: module-2-chapter-3-assessment.pdf";
    container.appendChild(link);
    document.body.appendChild(container);

    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/2?chapter=3");
  });

  it("ignores links outside #akvo-rag", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const outsideLink = document.createElement("a");
    outsideLink.href = "/academy/overview";
    outsideLink.setAttribute("href", "/academy/overview");
    document.body.appendChild(outsideLink);

    fireEvent.click(outsideLink);
    expect(mockNavigate).not.toHaveBeenCalled();
    outsideLink.remove();
  });

  it("handles initChat error gracefully", () => {
    initChat.mockImplementation(() => {
      throw new Error("Init failed");
    });
    const infoSpy = jest.spyOn(message, "info").mockImplementation(() => {});

    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const button = screen.getByTestId("academy-chatbot-button");
    fireEvent.click(button);
    expect(infoSpy).toHaveBeenCalledWith(
      "The Academy facilitator chat is coming soon."
    );
  });
});
