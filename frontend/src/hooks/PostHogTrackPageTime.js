import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import posthog from "posthog-js";

const usePostHogTrackPageTime = () => {
  const location = useLocation();
  const startTimeRef = useRef(Date.now());
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const sendTimeSpentEvent = () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const segments = previousPathRef.current.split("/").filter(Boolean);
      const caseIndex = segments.indexOf("case");

      if (caseIndex !== -1 && segments.length >= caseIndex + 3) {
        const caseId = segments[caseIndex + 1];
        const step = segments[caseIndex + 2];

        posthog.capture("page_duration", {
          category: "Page Duration",
          step: step,
          page: previousPathRef.current,
          case_id: caseId,
          duration_seconds: timeSpent,
          group: `case-${caseId}`,
        });

        console.info("posthog page_duration event", {
          category: "Page Duration",
          step,
          page: previousPathRef.current,
          case_id: caseId,
          duration_seconds: timeSpent,
        });
      }
    };

    sendTimeSpentEvent();

    startTimeRef.current = Date.now();
    previousPathRef.current = location.pathname;
  }, [location.pathname]);
};

export default usePostHogTrackPageTime;
