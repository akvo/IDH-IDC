import React from "react";
import { render, fireEvent } from "@testing-library/react";
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

const mockCurriculum = [
  {
    id: 1,
    order_index: 1,
    title: "The Concept of Living Income",
    chapters: [
      {
        id: 1,
        chapter_number: 1,
        title: "Why Living Income Matters to Farmers and Companies",
      },
      {
        id: 2,
        chapter_number: 2,
        title: "Living Income vs Living Wage: Understanding Distinction",
      },
      {
        id: 4,
        chapter_number: 4,
        title: "Setting Organizational Ambition and Scope",
      },
    ],
  },
  {
    id: 2,
    order_index: 2,
    title: "Measuring & Analysis",
    chapters: [
      {
        id: 5,
        chapter_number: 1,
        title: "Calculating the Living Income Benchmark",
      },
    ],
  },
];

describe("AcademyChatbot", () => {
  let mockChatInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChatInstance = {
      open: jest.fn(),
      close: jest.fn(),
      destroy: jest.fn(() => {
        const el = document.getElementById("akvo-rag");
        if (el) {
          el.remove();
        }
      }),
    };

    initChat.mockImplementation(() => {
      let el = document.getElementById("akvo-rag");
      if (!el) {
        el = document.createElement("div");
        el.id = "akvo-rag";
        document.body.appendChild(el);
      }
      return mockChatInstance;
    });

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

  it("initializes akvo-rag-js with native launcher and IDH branding", () => {
    const { unmount } = render(
      <AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />
    );

    expect(initChat).toHaveBeenCalledWith(
      expect.objectContaining({
        wsURL: "wss://test-rag.org/ws/chat",
        wsUrl: "wss://test-rag.org/ws/chat",
        kb_id: 753,
        botName: "Living Income AI",
        title: "Living Income AI",
        primaryColor: "#005EA3",
        showLauncher: true,
        startMinimized: true,
        launcherIcon: expect.stringContaining("<svg"),
      })
    );

    unmount();
    expect(mockChatInstance.destroy).toHaveBeenCalled();
  });

  it("falls back to default configurations when props are omitted", () => {
    render(<AcademyChatbot />);

    expect(initChat).toHaveBeenCalledWith(
      expect.objectContaining({
        wsURL: expect.any(String),
        wsUrl: expect.any(String),
        kb_id: expect.any(Number),
        primaryColor: "#005EA3",
        showLauncher: true,
      })
    );
  });

  it("intercepts /academy links clicked inside #akvo-rag and navigates via React Router", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const container = document.getElementById("akvo-rag");
    const link = document.createElement("a");
    link.href = "/academy/modules/1?chapter=2";
    link.setAttribute("href", "/academy/modules/1?chapter=2");
    link.textContent = "Go to Chapter 2";
    container.appendChild(link);

    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/1?chapter=2");
  });

  it("detects module-chapter filename patterns in citation anchors and deep-links", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const container = document.getElementById("akvo-rag");
    const link = document.createElement("a");
    link.setAttribute("href", "#");
    link.textContent = "Source: module-2-chapter-3-assessment.pdf";
    container.appendChild(link);

    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/2?chapter=3");
  });

  it("navigates to chapter when clicking a <sup class='citation'> element", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const container = document.getElementById("akvo-rag");
    const sup = document.createElement("sup");
    sup.className = "citation";
    sup.setAttribute(
      "data-source",
      "module-1-chapter-2-living-income-vs-wage.pdf"
    );
    sup.textContent = "[1]";
    container.appendChild(sup);

    fireEvent.click(sup);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/1?chapter=2");
  });

  it("auto-attaches related lesson box with verified chapter title from curriculum", async () => {
    render(
      <AcademyChatbot
        wsUrl="wss://test-rag.org/ws/chat"
        kbId="753"
        modules={mockCurriculum}
      />
    );

    const container = document.getElementById("akvo-rag");
    const msg = document.createElement("div");
    msg.className = "akvo-msg-assistant";
    const sup = document.createElement("sup");
    sup.className = "citation";
    sup.setAttribute("data-source", "module-1-chapter-4-setting-ambition.pdf");
    sup.textContent = "[4]";
    msg.appendChild(sup);
    container.appendChild(msg);

    // Give MutationObserver a moment to fire
    await new Promise((resolve) => setTimeout(resolve, 50));

    const referral = msg.querySelector(".academy-chat-referral");
    expect(referral).toBeInTheDocument();
    expect(referral).toHaveTextContent(
      /Related lesson:\s*Module 1, Chapter 4: Setting Organizational Ambition and Scope/i
    );
  });

  it("does not navigate or generate referral links when citation source is an unrelated reference document", () => {
    render(
      <AcademyChatbot
        wsUrl="wss://test-rag.org/ws/chat"
        kbId="753"
        modules={mockCurriculum}
      />
    );

    const container = document.getElementById("akvo-rag");
    const sup = document.createElement("sup");
    sup.className = "citation";
    sup.setAttribute(
      "data-source",
      "General_Agronomy_Soil_Report.pdf"
    );
    sup.setAttribute(
      "data-text",
      "nitrogen fertilizer and potassium levels in soil"
    );
    sup.textContent = "[7]";
    container.appendChild(sup);

    fireEvent.click(sup);
    // Unrelated documents MUST NOT trigger navigation
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to context-aware Module 1 chapter for living wage reference document", () => {
    render(
      <AcademyChatbot
        wsUrl="wss://test-rag.org/ws/chat"
        kbId="753"
        modules={mockCurriculum}
      />
    );

    const container = document.getElementById("akvo-rag");
    const sup = document.createElement("sup");
    sup.className = "citation";
    sup.setAttribute("data-source", "Fair Producer Prices.pdf");
    sup.setAttribute(
      "data-text",
      "worker remuneration and minimum living wage distinction"
    );
    sup.textContent = "[2]";
    container.appendChild(sup);

    fireEvent.click(sup);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/1?chapter=2");
  });

  it("suppresses links when module does not exist in active curriculum", () => {
    render(
      <AcademyChatbot
        wsUrl="wss://test-rag.org/ws/chat"
        kbId="753"
        modules={mockCurriculum}
      />
    );

    const container = document.getElementById("akvo-rag");
    const sup = document.createElement("sup");
    sup.className = "citation";
    sup.setAttribute("data-source", "module-9-chapter-1-unreleased.pdf");
    sup.textContent = "[9]";
    container.appendChild(sup);

    fireEvent.click(sup);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handles popover clicks and dismisses popover on navigation", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const popover = document.createElement("div");
    popover.className = "citation-popover";
    popover.dataset.target = "module-2-chapter-1-benchmarks.pdf";
    popover.textContent = "Source: Living Income Benchmarks";
    document.body.appendChild(popover);

    fireEvent.click(popover);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/2?chapter=1");
    expect(document.querySelector(".citation-popover")).toBeNull();
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

  it("handles initChat error gracefully without crashing", () => {
    initChat.mockImplementation(() => {
      throw new Error("Init failed");
    });

    expect(() => {
      render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);
    }).not.toThrow();
  });
});
