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
 * Strict Provenance Rule:
 * Only generates an internal Academy lesson route (/academy/modules/{X}?chapter={Y})
 * when the cited source explicitly follows the curriculum file pattern:
 * `module-{X}-chapter-{Y}-*`
 *
 * General background literature or reference documents (e.g. `Fair Producer Prices.pdf`,
 * `Defining... Benchmark.pdf`) do NOT generate internal Academy routes to prevent
 * speculative, hallucinated, or phantom lesson links.
 *
 * When curriculum metadata is available, the target is validated against the active
 * course modules and enriched with the verified chapter title.
 */
const resolveChapterTarget = (
  source = "",
  title = "",
  text = "",
  curriculumMap = null
) => {
  const combined = `${source} ${title} ${text}`.toLowerCase();

  // Tier 1: Direct file pattern match (e.g. module-1-chapter-2-...)
  const directMatch = combined.match(
    /module[-_ ]?(\d+)[-_ ]?chapter[-_ ]?(\d+)/i
  );
  if (directMatch) {
    const moduleNum = directMatch[1];
    const chapterNum = directMatch[2];
    const key = `m${moduleNum}c${chapterNum}`;

    let chapterTitle = "";
    if (curriculumMap && curriculumMap.size > 0) {
      const chapterData = curriculumMap.get(key);
      if (!chapterData) {
        // Module or chapter not found in active curriculum; suppress link
        return null;
      }
      chapterTitle = chapterData.chapterTitle || "";
    }

    return {
      module: moduleNum,
      chapter: chapterNum,
      title: chapterTitle,
      url: `/academy/modules/${moduleNum}?chapter=${chapterNum}`,
    };
  }

  // Tier 2: Context-aware mapping strictly for active/published Module 1 chapters
  // Gracefully bridges general reference PDFs (e.g. Fair Producer Prices.pdf) to actual lessons
  // No speculative rules for Module 2+ to prevent phantom links
  if (
    combined.includes("wage") &&
    (combined.includes("living income") ||
      combined.includes("distinction") ||
      combined.includes("worker") ||
      combined.includes("remuneration") ||
      combined.includes("price"))
  ) {
    return {
      module: "1",
      chapter: "2",
      title: "Living Income vs Living Wage: Understanding Distinction",
      url: "/academy/modules/1?chapter=2",
    };
  }
  if (combined.includes("roadmap") || combined.includes("principles")) {
    return {
      module: "1",
      chapter: "3",
      title: "Key Principles of the IDH Roadmap on Living Income",
      url: "/academy/modules/1?chapter=3",
    };
  }
  if (combined.includes("ambition") || combined.includes("scope")) {
    return {
      module: "1",
      chapter: "4",
      title: "Setting Organizational Ambition and Scope",
      url: "/academy/modules/1?chapter=4",
    };
  }
  if (
    combined.includes("living income") ||
    combined.includes("matters") ||
    combined.includes("decent standard") ||
    combined.includes("household")
  ) {
    return {
      module: "1",
      chapter: "1",
      title: "Why Living Income Matters to Farmers and Companies",
      url: "/academy/modules/1?chapter=1",
    };
  }

  return null;
};

const AcademyChatbot = ({
  wsUrl = DEFAULT_WS_URL,
  kbId = DEFAULT_KB_ID,
  modules = null,
}) => {
  const navigate = useNavigate();
  const chatRef = useRef(null);
  const curriculumMapRef = useRef(null);

  // Sync course curriculum to validate modules/chapters and enrich link titles
  useEffect(() => {
    if (!modules || !Array.isArray(modules) || !modules.length) {
      return;
    }
    const map = new Map();
    modules.forEach((mod) => {
      const modNum = mod.order_index ?? mod.id;
      (mod?.chapters || []).forEach((chap) => {
        const chapNum = chap.chapter_number;
        const key = `m${modNum}c${chapNum}`;
        map.set(key, {
          moduleId: mod.id,
          moduleNumber: modNum,
          moduleTitle: mod.title,
          chapterNumber: chapNum,
          chapterTitle: chap.title,
        });
      });
    });
    curriculumMapRef.current = map;
  }, [modules]);

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
        const target = resolveChapterTarget(
          source,
          title,
          text,
          curriculumMapRef.current
        );
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
          "",
          curriculumMapRef.current
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

        const target = resolveChapterTarget(
          href,
          anchor.textContent,
          "",
          curriculumMapRef.current
        );
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
          const target = resolveChapterTarget(
            source,
            title,
            text,
            curriculumMapRef.current
          );
          if (target) {
            const key = `m${target.module}c${target.chapter}`;
            if (!foundChapters.has(key)) {
              foundChapters.set(key, target);
            }
          }
        });

        // Contextual fallback: if citations did not directly map to a chapter,
        // inspect the assistant message text for core Module 1 curriculum topics
        if (foundChapters.size === 0) {
          const fallbackTarget = resolveChapterTarget(
            "",
            "",
            msg.textContent || "",
            curriculumMapRef.current
          );
          if (fallbackTarget) {
            const key = `m${fallbackTarget.module}c${fallbackTarget.chapter}`;
            foundChapters.set(key, fallbackTarget);
          }
        }

        if (foundChapters.size > 0) {
          const referralContainer = document.createElement("div");
          referralContainer.className = "academy-chat-referral";
          referralContainer.innerHTML = `
            <span class="referral-icon" aria-hidden="true">📖</span>
            <span class="referral-label">Related lesson:</span>
            ${Array.from(foundChapters.values())
              .map((c) => {
                const label = c.title
                  ? `Module ${c.module}, Chapter ${c.chapter}: ${c.title}`
                  : `Module ${c.module}, Chapter ${c.chapter}`;
                return `<a href="${c.url}" class="referral-link" title="Open ${label}">${label}</a>`;
              })
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
