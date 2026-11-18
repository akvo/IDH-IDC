import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { initChat } from "akvo-rag-js";
import ChatbotFloatButton from "./ChatbotFloatButton";
import "./AcademyChatbot.scss";

const DEFAULT_WS_URL = process.env.REACT_APP_AKVO_RAG_WS_URL;
const DEFAULT_KB_ID = process.env.REACT_APP_AKVO_RAG_KB_ID;

const AcademyChatbot = ({ wsUrl = DEFAULT_WS_URL, kbId = DEFAULT_KB_ID }) => {
  const navigate = useNavigate();
  const chatRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!wsUrl || !kbId) {
      return;
    }

    try {
      chatRef.current = initChat({
        ws_url: wsUrl,
        kb_id: Number(kbId),
        botName: "Living Income AI",
        primaryColor: "#007A78",
        startMinimized: true,
        showLauncher: false,
      });
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

      // Sync state if user clicked the close button inside the chat header
      const closeBtn = e.target.closest("#akvo-rag-close-btn");
      if (closeBtn) {
        setIsOpen(false);
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

  const handleToggle = useCallback(() => {
    if (!chatRef.current) {
      message.info("The Academy facilitator chat is coming soon.");
      return;
    }

    if (isOpen) {
      chatRef.current.close();
      setIsOpen(false);
    } else {
      chatRef.current.open();
      setIsOpen(true);
    }
  }, [isOpen]);

  return (
    <div
      className={`academy-chatbot-wrapper ${
        isOpen ? "academy-chatbot-open" : ""
      }`}
      data-testid="academy-chatbot-wrapper"
    >
      <ChatbotFloatButton onClick={handleToggle} />
    </div>
  );
};

export default AcademyChatbot;
