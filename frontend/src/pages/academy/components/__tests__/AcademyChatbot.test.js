import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { initChat } from "akvo-rag-js";
import AcademyChatbot, {
  resolveChapterTarget,
  renderCitationReferralBox,
  LAUNCHER_STORAGE_KEY,
} from "../AcademyChatbot";

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
      let launcher = document.getElementById("akvo-rag-launcher");
      if (!launcher) {
        launcher = document.createElement("button");
        launcher.id = "akvo-rag-launcher";
        document.body.appendChild(launcher);
      }
      return mockChatInstance;
    });

    const existing = document.getElementById("akvo-rag");
    if (existing) {
      existing.remove();
    }
    const existingLauncher = document.getElementById("akvo-rag-launcher");
    if (existingLauncher) {
      existingLauncher.remove();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    const existing = document.getElementById("akvo-rag");
    if (existing) {
      existing.remove();
    }
    const existingLauncher = document.getElementById("akvo-rag-launcher");
    if (existingLauncher) {
      existingLauncher.remove();
    }
  });

  it("initializes akvo-rag-js v1.4.0 with native draggable launcher and IDH branding", () => {
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
        draggable: true,
        persistPosition: true,
        storageKey: LAUNCHER_STORAGE_KEY,
      })
    );

    const launcher = document.getElementById("akvo-rag-launcher");
    expect(launcher).toBeInTheDocument();
    expect(launcher.getAttribute("title")).toBe("Ask the Academy facilitator");

    unmount();
    expect(mockChatInstance.destroy).toHaveBeenCalled();
  });

  it("falls back to environment variables when props are omitted", () => {
    const origWs = process.env.REACT_APP_AKVO_RAG_WS_URL;
    const origKb = process.env.REACT_APP_AKVO_RAG_KB_ID;
    process.env.REACT_APP_AKVO_RAG_WS_URL = "wss://env-rag.org/ws/chat";
    process.env.REACT_APP_AKVO_RAG_KB_ID = "753";

    try {
      render(<AcademyChatbot />);

      expect(initChat).toHaveBeenCalledWith(
        expect.objectContaining({
          wsURL: "wss://env-rag.org/ws/chat",
          wsUrl: "wss://env-rag.org/ws/chat",
          kb_id: 753,
          primaryColor: "#005EA3",
          showLauncher: true,
          draggable: true,
          persistPosition: true,
          storageKey: "academy_chat_launcher_pos",
        })
      );
    } finally {
      process.env.REACT_APP_AKVO_RAG_WS_URL = origWs;
      process.env.REACT_APP_AKVO_RAG_KB_ID = origKb;
    }
  });

  it("does not initialize when wsUrl or kbId are missing", () => {
    const origWs = process.env.REACT_APP_AKVO_RAG_WS_URL;
    const origKb = process.env.REACT_APP_AKVO_RAG_KB_ID;
    delete process.env.REACT_APP_AKVO_RAG_WS_URL;
    delete process.env.REACT_APP_AKVO_RAG_KB_ID;

    try {
      render(<AcademyChatbot wsUrl="" kbId="" />);
      expect(initChat).not.toHaveBeenCalled();
    } finally {
      process.env.REACT_APP_AKVO_RAG_WS_URL = origWs;
      process.env.REACT_APP_AKVO_RAG_KB_ID = origKb;
    }
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

  it("intercepts absolute domain /academy links and transforms to SPA route", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const container = document.getElementById("akvo-rag");
    const link = document.createElement("a");
    link.href = "https://idc.akvotest.org/academy/modules/1?chapter=3";
    link.setAttribute(
      "href",
      "https://idc.akvotest.org/academy/modules/1?chapter=3"
    );
    link.textContent = "Go to Chapter 3";
    container.appendChild(link);

    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/1?chapter=3");
  });

  it("intercepts citation clicks and navigates to the matching curriculum chapter", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const container = document.getElementById("akvo-rag");
    const sup = document.createElement("sup");
    sup.className = "citation";
    sup.setAttribute("data-source", "module-1-chapter-2-understanding-gap.pdf");
    sup.setAttribute("data-title", "Living Income vs Living Wage");
    sup.textContent = "[1]";
    container.appendChild(sup);

    fireEvent.click(sup);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/1?chapter=2");
    expect(mockChatInstance.close).toHaveBeenCalled();
  });

  it("intercepts popover clicks and navigates to the target chapter", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const popover = document.createElement("div");
    popover.className = "citation-popover";
    popover.dataset.target = "module-1-chapter-4-ambition.pdf";
    popover.innerText = "Setting Ambition";
    document.body.appendChild(popover);

    fireEvent.click(popover);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/1?chapter=4");
    expect(mockChatInstance.close).toHaveBeenCalled();
    expect(document.querySelector(".citation-popover")).toBeNull();
  });

  it("renders referral link with enriched chapter title from curriculum metadata", () => {
    const { container: componentRoot } = render(
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
    sup.setAttribute("data-source", "module-1-chapter-2-understanding-gap.pdf");
    sup.setAttribute("data-title", "Living Income vs Living Wage");
    sup.textContent = "[1]";
    msg.appendChild(sup);
    container.appendChild(msg);

    // Call referral box renderer directly with enriched map
    const map = new Map();
    map.set("m1c2", {
      moduleId: 1,
      moduleNumber: 1,
      chapterNumber: 2,
      chapterTitle: "Living Income vs Living Wage: Understanding Distinction",
    });

    renderCitationReferralBox(msg, map, mockNavigate, mockChatInstance);

    const referral = msg.querySelector(".academy-chat-referral");
    expect(referral).toBeInTheDocument();
    const link = referral.querySelector(".referral-link");
    expect(link).toHaveTextContent(
      "Module 1, Chapter 2: Living Income vs Living Wage: Understanding Distinction"
    );

    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith("/academy/modules/1?chapter=2");
    expect(mockChatInstance.close).toHaveBeenCalled();

    expect(componentRoot).toBeInTheDocument();
  });

  it("enforces strict provenance: does not generate internal link for non-curriculum documents", () => {
    render(<AcademyChatbot wsUrl="wss://test-rag.org/ws/chat" kbId="753" />);

    const target = resolveChapterTarget(
      "General_Agronomy_Soil_Report.pdf",
      "Soil Analysis",
      "Soil pH and moisture findings"
    );
    expect(target).toBeNull();
  });

  it("gracefully falls back to module chapter mapping for Module 1 core concepts", () => {
    const targetWage = resolveChapterTarget(
      "Fair Producer Prices.pdf",
      "Living wage remuneration of workers",
      "difference between worker remuneration and farmer income"
    );
    expect(targetWage).toEqual({
      module: "1",
      chapter: "2",
      title: "Living Income vs Living Wage: Understanding Distinction",
      url: "/academy/modules/1?chapter=2",
    });

    const targetRoadmap = resolveChapterTarget(
      "IDH_Strategy.pdf",
      "Roadmap principles",
      "principles of roadmap"
    );
    expect(targetRoadmap).toEqual({
      module: "1",
      chapter: "3",
      title: "Key Principles of the IDH Roadmap on Living Income",
      url: "/academy/modules/1?chapter=3",
    });
  });

  it("suppresses referral card when citation has no valid target", () => {
    const msg = document.createElement("div");
    msg.className = "akvo-msg-assistant";
    const sup = document.createElement("sup");
    sup.className = "citation";
    sup.setAttribute("data-source", "General_Agronomy_Soil_Report.pdf");
    msg.appendChild(sup);

    renderCitationReferralBox(msg, null, mockNavigate, mockChatInstance);
    expect(msg.querySelector(".academy-chat-referral")).toBeNull();
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
