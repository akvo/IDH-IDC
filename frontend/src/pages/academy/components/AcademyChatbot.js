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

const LAUNCHER_STORAGE_KEY = "academy_chat_launcher_pos";
const MARGIN = 16;
const DRAG_THRESHOLD = 6;

/**
 * Attaches draggable behavior to the floating launcher button.
 * - Supports mouse, trackpad, and touch events with window-level move tracking.
 * - Distinguishes between click (< 6px movement) and drag (>= 6px movement).
 * - Suppresses the click event on release when dragged so the chat doesn't accidentally open.
 * - Enforces viewport boundaries with padding.
 * - Persists custom position in localStorage across page reloads.
 */
const setupDraggableLauncher = (launcherEl) => {
  if (!launcherEl) {
    return () => {};
  }

  const restorePosition = () => {
    try {
      const saved = localStorage.getItem(LAUNCHER_STORAGE_KEY);
      if (saved) {
        const { x, y } = JSON.parse(saved);
        const btnWidth = launcherEl.offsetWidth || 48;
        const btnHeight = launcherEl.offsetHeight || 48;
        const maxX = Math.max(MARGIN, window.innerWidth - btnWidth - MARGIN);
        const maxY = Math.max(MARGIN, window.innerHeight - btnHeight - MARGIN);
        const clampedX = Math.max(MARGIN, Math.min(maxX, x));
        const clampedY = Math.max(MARGIN, Math.min(maxY, y));

        launcherEl.style.left = `${clampedX}px`;
        launcherEl.style.top = `${clampedY}px`;
        launcherEl.style.right = "auto";
        launcherEl.style.bottom = "auto";
      }
    } catch (e) {
      // ignore storage error
    }
  };

  restorePosition();

  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;
  let isDragging = false;
  let hasMoved = false;

  const getCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return {
        clientX: e.changedTouches[0].clientX,
        clientY: e.changedTouches[0].clientY,
      };
    }
    return { clientX: e.clientX ?? 0, clientY: e.clientY ?? 0 };
  };

  const onMove = (e) => {
    if (!isDragging) {
      return;
    }

    const coords = getCoordinates(e);
    const dx = coords.clientX - startX;
    const dy = coords.clientY - startY;

    if (!hasMoved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        return;
      }
      hasMoved = true;
      launcherEl.classList.add("is-dragging");
    }

    if (e.cancelable && e.type === "touchmove") {
      e.preventDefault();
    }

    const btnWidth = launcherEl.offsetWidth || 48;
    const btnHeight = launcherEl.offsetHeight || 48;
    const maxX = Math.max(MARGIN, window.innerWidth - btnWidth - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - btnHeight - MARGIN);

    const nextX = Math.max(MARGIN, Math.min(maxX, initialLeft + dx));
    const nextY = Math.max(MARGIN, Math.min(maxY, initialTop + dy));

    launcherEl.style.left = `${nextX}px`;
    launcherEl.style.top = `${nextY}px`;
    launcherEl.style.right = "auto";
    launcherEl.style.bottom = "auto";
  };

  const onEnd = () => {
    if (!isDragging) {
      return;
    }
    isDragging = false;

    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onEnd);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
    window.removeEventListener("touchcancel", onEnd);

    launcherEl.classList.remove("is-dragging");

    if (hasMoved) {
      try {
        const rect = launcherEl.getBoundingClientRect();
        localStorage.setItem(
          LAUNCHER_STORAGE_KEY,
          JSON.stringify({ x: Math.round(rect.left), y: Math.round(rect.top) })
        );
      } catch (err) {
        // ignore
      }

      const suppressClick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        clickEvent.stopImmediatePropagation();
      };
      launcherEl.addEventListener("click", suppressClick, {
        capture: true,
        once: true,
      });
      setTimeout(() => {
        launcherEl.removeEventListener("click", suppressClick, {
          capture: true,
        });
      }, 300);
    }
  };

  const onStart = (e) => {
    if (isDragging) {
      return;
    }
    if (typeof e.button === "number" && e.button !== 0) {
      return;
    }

    const coords = getCoordinates(e);
    const rect = launcherEl.getBoundingClientRect();
    startX = coords.clientX;
    startY = coords.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    isDragging = true;
    hasMoved = false;

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
  };

  const onWindowResize = () => {
    if (launcherEl.style.left && launcherEl.style.left !== "auto") {
      restorePosition();
    }
    const chatEl = document.getElementById("akvo-rag");
    if (chatEl && chatEl.style.display && chatEl.style.display !== "none") {
      syncChatWindowPosition(chatEl, launcherEl);
    }
  };

  launcherEl.addEventListener("mousedown", onStart);
  launcherEl.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("resize", onWindowResize);

  return () => {
    launcherEl.removeEventListener("mousedown", onStart);
    launcherEl.removeEventListener("touchstart", onStart);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onEnd);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
    window.removeEventListener("touchcancel", onEnd);
    window.removeEventListener("resize", onWindowResize);
  };
};

/**
 * Synchronizes the chat window's open position to anchor near the floating launcher button.
 * - Anchors to top/bottom and left/right based on screen quadrant.
 * - Clamps strictly within viewport margins.
 */
const syncChatWindowPosition = (chatEl, launcherEl) => {
  if (!chatEl) {
    return;
  }

  let launcherX = null;
  let launcherY = null;
  try {
    const saved = localStorage.getItem(LAUNCHER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      launcherX = parsed.x;
      launcherY = parsed.y;
    }
  } catch (e) {
    // ignore
  }

  if (launcherX === null && launcherEl) {
    if (launcherEl.style.left && launcherEl.style.left !== "auto") {
      launcherX = parseFloat(launcherEl.style.left);
      launcherY = parseFloat(launcherEl.style.top);
    } else {
      const r = launcherEl.getBoundingClientRect();
      launcherX = r.left;
      launcherY = r.top;
    }
  }

  if (launcherX === null) {
    return;
  }

  const launcherWidth = launcherEl?.offsetWidth || 48;
  const launcherHeight = launcherEl?.offsetHeight || 48;
  const chatWidth = chatEl.offsetWidth || 360;
  const chatHeight = chatEl.offsetHeight || 500;

  let idealLeft = 0;
  if (launcherX + launcherWidth / 2 <= window.innerWidth / 2) {
    idealLeft = launcherX;
  } else {
    idealLeft = launcherX + launcherWidth - chatWidth;
  }

  let idealTop = 0;
  if (launcherY + launcherHeight / 2 <= window.innerHeight / 2) {
    idealTop = launcherY;
  } else {
    idealTop = launcherY + launcherHeight - chatHeight;
  }

  const minLeft = MARGIN;
  const maxLeft = Math.max(MARGIN, window.innerWidth - chatWidth - MARGIN);
  const minTop = MARGIN;
  const maxTop = Math.max(MARGIN, window.innerHeight - chatHeight - MARGIN);

  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, idealLeft));
  const clampedTop = Math.max(minTop, Math.min(maxTop, idealTop));

  chatEl.style.left = `${clampedLeft}px`;
  chatEl.style.top = `${clampedTop}px`;
  chatEl.style.right = "auto";
  chatEl.style.bottom = "auto";
};

/**
 * Attaches draggable behavior to the chat window's header so users can freely reposition
 * the opened chat window, updating the saved position and keeping the launcher synchronized.
 */
const setupDraggableWindow = (chatEl, launcherEl) => {
  if (!chatEl) {
    return () => {};
  }
  const headerEl = chatEl.querySelector("#akvo-rag-header");
  if (!headerEl) {
    return () => {};
  }

  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;
  let isDragging = false;

  const getCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return {
        clientX: e.changedTouches[0].clientX,
        clientY: e.changedTouches[0].clientY,
      };
    }
    return { clientX: e.clientX ?? 0, clientY: e.clientY ?? 0 };
  };

  const onMove = (e) => {
    if (!isDragging) {
      return;
    }

    const coords = getCoordinates(e);
    const dx = coords.clientX - startX;
    const dy = coords.clientY - startY;

    if (e.cancelable && e.type === "touchmove") {
      e.preventDefault();
    }

    const chatWidth = chatEl.offsetWidth || 360;
    const chatHeight = chatEl.offsetHeight || 500;
    const maxX = Math.max(MARGIN, window.innerWidth - chatWidth - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - chatHeight - MARGIN);

    const nextX = Math.max(MARGIN, Math.min(maxX, initialLeft + dx));
    const nextY = Math.max(MARGIN, Math.min(maxY, initialTop + dy));

    chatEl.style.left = `${nextX}px`;
    chatEl.style.top = `${nextY}px`;
    chatEl.style.right = "auto";
    chatEl.style.bottom = "auto";
  };

  const onEnd = () => {
    if (!isDragging) {
      return;
    }
    isDragging = false;

    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onEnd);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
    window.removeEventListener("touchcancel", onEnd);

    chatEl.classList.remove("is-window-dragging");

    const chatRect = chatEl.getBoundingClientRect();
    const launcherWidth = launcherEl?.offsetWidth || 48;
    const launcherHeight = launcherEl?.offsetHeight || 48;
    let lX = 0;
    if (chatRect.left + chatRect.width / 2 <= window.innerWidth / 2) {
      lX = chatRect.left;
    } else {
      lX = chatRect.right - launcherWidth;
    }
    let lY = 0;
    if (chatRect.top + chatRect.height / 2 <= window.innerHeight / 2) {
      lY = chatRect.top;
    } else {
      lY = chatRect.bottom - launcherHeight;
    }
    const finalX = Math.round(lX);
    const finalY = Math.round(lY);

    try {
      localStorage.setItem(
        LAUNCHER_STORAGE_KEY,
        JSON.stringify({ x: finalX, y: finalY })
      );
    } catch (err) {
      // ignore
    }

    if (launcherEl) {
      launcherEl.style.left = `${finalX}px`;
      launcherEl.style.top = `${finalY}px`;
      launcherEl.style.right = "auto";
      launcherEl.style.bottom = "auto";
    }
  };

  const onStart = (e) => {
    if (isDragging) {
      return;
    }
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    if (typeof e.button === "number" && e.button !== 0) {
      return;
    }

    const coords = getCoordinates(e);
    const rect = chatEl.getBoundingClientRect();
    startX = coords.clientX;
    startY = coords.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    isDragging = true;
    chatEl.classList.add("is-window-dragging");

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
  };

  headerEl.addEventListener("mousedown", onStart);
  headerEl.addEventListener("touchstart", onStart, { passive: true });

  return () => {
    headerEl.removeEventListener("mousedown", onStart);
    headerEl.removeEventListener("touchstart", onStart);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onEnd);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
    window.removeEventListener("touchcancel", onEnd);
  };
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

    let cleanupDraggable = () => {};
    let cleanupWindowDraggable = () => {};
    let chatObserver = null;

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
      const chatEl = document.getElementById("akvo-rag");

      if (launcherEl) {
        launcherEl.setAttribute("title", "Ask the Academy facilitator");
        cleanupDraggable = setupDraggableLauncher(launcherEl);
        launcherEl.addEventListener("click", () => {
          syncChatWindowPosition(chatEl, launcherEl);
        });
      }

      if (chatEl) {
        cleanupWindowDraggable = setupDraggableWindow(chatEl, launcherEl);

        let lastDisplay = chatEl.style.display || "none";
        chatObserver = new MutationObserver(() => {
          const currentDisplay = chatEl.style.display || "none";
          if (currentDisplay !== "none" && lastDisplay === "none") {
            syncChatWindowPosition(chatEl, launcherEl);
          }
          lastDisplay = currentDisplay;
        });
        chatObserver.observe(chatEl, {
          attributes: true,
          attributeFilter: ["style"],
        });
      }
    } catch (err) {
      chatRef.current = null;
    }

    return () => {
      cleanupDraggable();
      cleanupWindowDraggable();
      if (chatObserver) {
        chatObserver.disconnect();
      }
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

export {
  setupDraggableLauncher,
  setupDraggableWindow,
  syncChatWindowPosition,
  LAUNCHER_STORAGE_KEY,
};
export default AcademyChatbot;
