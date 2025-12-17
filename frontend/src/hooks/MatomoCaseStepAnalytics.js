import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const useMatomoCaseStepAnalytics = () => {
  const location = useLocation();

  const startTimeRef = useRef(Date.now());
  const previousPathRef = useRef(null);

  useEffect(() => {
    if (!window._paq) {
      return;
    }

    /**
     * 1️⃣ Send step duration EVENT for the previous route
     */
    if (previousPathRef.current) {
      const durationSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );

      const prevSegments = previousPathRef.current.split("/").filter(Boolean);
      const prevCaseIndex = prevSegments.indexOf("case");

      if (prevCaseIndex !== -1 && prevSegments.length >= prevCaseIndex + 3) {
        const caseId = prevSegments[prevCaseIndex + 1];
        const step = prevSegments[prevCaseIndex + 2];

        window._paq.push([
          "trackEvent",
          "Case Step Page Duration", // Category (future-proof)
          step, // Action
          `case/${caseId}`, // Label
          durationSeconds, // Value (seconds)
        ]);

        console.info("Matomo step duration event", {
          step,
          case_id: caseId,
          duration_seconds: durationSeconds,
        });
      }
    }

    /**
     * 2️⃣ Track PAGE VIEW for the new route
     */
    const segments = location.pathname.split("/").filter(Boolean);
    const caseIndex = segments.indexOf("case");

    let title = document.title;

    if (caseIndex !== -1 && segments.length >= caseIndex + 3) {
      const step = segments[caseIndex + 2];
      title = `Case Step – ${step}`;
    }

    window._paq.push(["setCustomUrl", location.pathname]);
    window._paq.push(["setDocumentTitle", title]);
    window._paq.push(["trackPageView"]);

    console.info("Matomo page tracked", {
      path: location.pathname,
      title,
    });

    /**
     * 3️⃣ Reset refs for next navigation
     */
    startTimeRef.current = Date.now();
    previousPathRef.current = location.pathname;
  }, [location.pathname]);
};

export default useMatomoCaseStepAnalytics;
