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

/**
 * Resolves a citation or popover click into an Academy module & chapter URL.
 *
 * Tier 1 (Automated): Dynamically extracts module and chapter from standard filenames
 * (e.g. `module-3-chapter-4-*.pdf`). No manual mapping needed for new modules/chapters.
 *
 * Tier 2 (Fallback): Provides a graceful fallback for legacy or reference PDFs uploaded
 * without standard filenames (e.g. `Fair Producer Prices.pdf`), mapping common curriculum
 * topics to their respective introductory chapters so clicks never silently fail.
 */
const resolveChapterTarget = (source = "", title = "", text = "") => {
  const combined = `${source} ${title} ${text}`.toLowerCase();

  // Tier 1: Automated extraction from standard filenames (supports any module/chapter dynamically)
  const directMatch = combined.match(
    /module[-_ ]?(\d+)[-_ ]?chapter[-_ ]?(\d+)/i
  );
  if (directMatch) {
    return {
      module: directMatch[1],
      chapter: directMatch[2],
      url: `/academy/modules/${directMatch[1]}?chapter=${directMatch[2]}`,
    };
  }

  // Tier 2: Defensive topic fallback for legacy/external reference PDFs lacking standard filenames
  if (
    combined.includes("wage") &&
    (combined.includes("living income") || combined.includes("distinction"))
  ) {
    return { module: "1", chapter: "2", url: "/academy/modules/1?chapter=2" };
  }
  if (combined.includes("roadmap") || combined.includes("principles")) {
    return { module: "1", chapter: "3", url: "/academy/modules/1?chapter=3" };
  }
  if (combined.includes("ambition") || combined.includes("scope")) {
    return { module: "1", chapter: "4", url: "/academy/modules/1?chapter=4" };
  }
  if (combined.includes("benchmark") || combined.includes("anker")) {
    return { module: "2", chapter: "1", url: "/academy/modules/2?chapter=1" };
  }
  if (combined.includes("measuring") || combined.includes("actual income")) {
    return { module: "2", chapter: "2", url: "/academy/modules/2?chapter=2" };
  }
  if (combined.includes("income gap") || combined.includes("gap")) {
    return { module: "2", chapter: "3", url: "/academy/modules/2?chapter=3" };
  }
  if (
    combined.includes("living income") ||
    combined.includes("matters") ||
    combined.includes("why living income")
  ) {
    return { module: "1", chapter: "1", url: "/academy/modules/1?chapter=1" };
  }

  return null;
};

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

  // Click delegation & Citation linkification for SPA deep-linking
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const container = document.getElementById("akvo-rag");
      const popover = e.target.closest(".citation-popover");

      if ((!container || !container.contains(e.target)) && !popover) {
        return;
      }

      const navigateToLesson = (url) => {
        e.preventDefault();
        document
          .querySelectorAll(".citation-popover")
          .forEach((p) => p.remove());
        if (chatRef.current?.close) {
          try {
            chatRef.current.close();
          } catch (err) {
            // ignore cleanup errors
          }
        }
        navigate(url);
      };

      // 1. Direct citation click (<sup class="citation" ...>)
      const citation = e.target.closest(".citation");
      if (citation) {
        const source = citation.getAttribute("data-source") || "";
        const title = citation.getAttribute("data-title") || "";
        const text = citation.getAttribute("data-text") || "";
        const target = resolveChapterTarget(source, title, text);
        if (target) {
          navigateToLesson(target.url);
          return;
        }
      }

      // Popover click
      if (popover) {
        const target = resolveChapterTarget(
          popover.dataset.target || "",
          popover.innerText,
          ""
        );
        if (target) {
          navigateToLesson(target.url);
          return;
        }
      }

      // 2. Direct anchor click
      const anchor = e.target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (href.startsWith("/academy")) {
          navigateToLesson(href);
          return;
        }

        const target = resolveChapterTarget(href, anchor.textContent, "");
        if (target) {
          navigateToLesson(target.url);
          return;
        }

        if (href.startsWith("http://") || href.startsWith("https://")) {
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "noopener noreferrer");
        }
      }
    };

    // Auto-attach related lesson links from citation metadata
    const attachReferralLinks = () => {
      const container = document.getElementById("akvo-rag");
      if (!container) {
        return;
      }

      const assistantMsgs = container.querySelectorAll(".akvo-msg-assistant");
      assistantMsgs.forEach((msg) => {
        if (msg.querySelector(".academy-chat-referral")) {
          return;
        }

        const citations = msg.querySelectorAll(".citation");
        if (!citations.length) {
          return;
        }

        const foundChapters = new Map();
        citations.forEach((cit) => {
          const source = cit.getAttribute("data-source") || "";
          const title = cit.getAttribute("data-title") || "";
          const text = cit.getAttribute("data-text") || "";
          const target = resolveChapterTarget(source, title, text);
          if (target) {
            const key = `m${target.module}c${target.chapter}`;
            if (!foundChapters.has(key)) {
              foundChapters.set(key, target);
            }
          }
        });

        if (foundChapters.size > 0) {
          const referralContainer = document.createElement("div");
          referralContainer.className = "academy-chat-referral";
          referralContainer.innerHTML = `
            <span class="referral-icon" aria-hidden="true">📖</span>
            <span class="referral-label">Related lesson:</span>
            ${Array.from(foundChapters.values())
              .map(
                (c) =>
                  `<a href="${c.url}" class="referral-link" title="Open Module ${c.module}, Chapter ${c.chapter}">Module ${c.module}, Chapter ${c.chapter}</a>`
              )
              .join(", ")}
          `;
          msg.appendChild(referralContainer);
        }
      });
    };

    document.addEventListener("click", handleDocumentClick);

    let observer = null;
    const chatContainer = document.getElementById("akvo-rag");
    if (chatContainer) {
      observer = new MutationObserver(attachReferralLinks);
      observer.observe(chatContainer, { childList: true, subtree: true });
    }

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [navigate]);

  return <div data-testid="academy-chatbot" id="academy-chatbot-root" />;
};

export default AcademyChatbot;
