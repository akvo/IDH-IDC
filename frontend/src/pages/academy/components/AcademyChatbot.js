import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { initChat } from "akvo-rag-js";
import "akvo-rag-js/dist/akvo-rag.css";
import "./AcademyChatbot.scss";

const DEFAULT_WS_URL =
  process.env.REACT_APP_AKVO_RAG_WS_URL ||
  "wss://akvo-rag.akvotest.org/ws/chat";
const DEFAULT_KB_ID = process.env.REACT_APP_AKVO_RAG_KB_ID || "753";

const CHAT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M23.9178 47.7421C14.4554 49.1221 4.56517 44.982 1.3887 34.5145C-2.2713 22.6708 1.25852 7.2523 12.5101 1.86978C26.3095 -4.46128 45.1116 6.02849 47.8231 22.15C49.735 36.7167 35.7756 46.5703 23.9215 47.7383" fill="#005EA3"/><g transform="translate(12, 12)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></g></svg>`;

const AcademyChatbot = ({ wsUrl = DEFAULT_WS_URL, kbId = DEFAULT_KB_ID }) => {
  const navigate = useNavigate();
  const chatRef = useRef(null);

  useEffect(() => {
    const activeWsUrl = wsUrl || DEFAULT_WS_URL;
    const activeKbId = Number(kbId) || Number(DEFAULT_KB_ID);

    if (!activeWsUrl || !activeKbId) {
      return;
    }

    try {
      chatRef.current = initChat({
        wsURL: activeWsUrl,
        wsUrl: activeWsUrl,
        kb_id: activeKbId,
        botName: "Living Income AI",
        title: "Living Income AI",
        primaryColor: "#005EA3",
        showLauncher: true,
        startMinimized: true,
        launcherIcon: CHAT_ICON_SVG,
      });

      const launcherEl = document.getElementById("akvo-rag-launcher");
      if (launcherEl) {
        launcherEl.setAttribute("title", "Ask the Academy facilitator");
      }
    } catch (err) {
      chatRef.current = null;
    }

    return () => {
      if (chatRef.current) {
        try {
          chatRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
        chatRef.current = null;
      }
    };
  }, [wsUrl, kbId]);

  // Click delegation for SPA deep-linking
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const container = document.getElementById("akvo-rag");
      if (!container || !container.contains(e.target)) {
        return;
      }

      const anchor = e.target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (href.startsWith("/academy")) {
          e.preventDefault();
          navigate(href);
          return;
        }

        const targetText = `${href} ${anchor.textContent}`;
        const match = targetText.match(/module-(\d+)-chapter-(\d+)/i);
        if (match) {
          e.preventDefault();
          navigate(`/academy/modules/${match[1]}?chapter=${match[2]}`);
        }
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [navigate]);

  return <div data-testid="academy-chatbot" id="academy-chatbot-root" />;
};

export default AcademyChatbot;
