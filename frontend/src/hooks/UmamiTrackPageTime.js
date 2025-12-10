import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const useUmamiTrackPageTime = () => {
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

        // Umami custom event tracking
        if (window.umami) {
          window.umami.track("page_duration", {
            step,
            case_id: caseId,
            page: previousPathRef.current,
            duration_seconds: timeSpent,
          });
        }

        console.info("umami page_duration event", {
          step,
          case_id: caseId,
          page: previousPathRef.current,
          duration_seconds: timeSpent,
        });
      }
    };

    sendTimeSpentEvent();

    startTimeRef.current = Date.now();
    previousPathRef.current = location.pathname;
  }, [location.pathname]);
};

export default useUmamiTrackPageTime;
