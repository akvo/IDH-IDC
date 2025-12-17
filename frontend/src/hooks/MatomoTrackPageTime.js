import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const useMatomoTrackStepDuration = () => {
  const location = useLocation();
  const startTimeRef = useRef(Date.now());
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    if (!window._paq) return;

    const sendStepDuration = () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const segments = previousPathRef.current.split("/").filter(Boolean);
      const caseIndex = segments.indexOf("case");

      if (caseIndex !== -1 && segments.length >= caseIndex + 3) {
        const caseId = segments[caseIndex + 1];
        const step = segments[caseIndex + 2];

        window._paq.push([
          "trackEvent",
          "Page Duration", // Category
          step, // Action
          `case/${caseId}`, // Label
          timeSpent, // Value (seconds)
        ]);

        console.info("Matomo step duration sent", {
          event: "trackEvent",
          category: "Page Duration",
          step,
          case_id: caseId,
          duration_seconds: timeSpent,
        });
      }
    };

    // Send duration for the PREVIOUS step
    sendStepDuration();

    // Reset timer for the NEW route
    startTimeRef.current = Date.now();
    previousPathRef.current = location.pathname;
  }, [location.pathname]);
};

export default useMatomoTrackStepDuration;
