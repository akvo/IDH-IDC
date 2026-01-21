import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { CustomEvent } from "@piwikpro/react-piwik-pro";

const usePiwikTrackPageTime = () => {
  const location = useLocation();
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const sendTimeSpentEvent = () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // updated due to adding group income-driver-calculator into the path
      const segments = location.pathname.split("/").filter(Boolean);
      const [, currentPage, caseId, step] = segments;

      if (currentPage === "case" && segments.length >= 3) {
        CustomEvent.trackEvent(
          "Page Duration", // Event Category
          step, // Event Action (e.g. step name)
          `case/${caseId}`, // Event Name (label)
          timeSpent, // Event Value (duration in seconds)
          { dimension9: `case-${caseId}` } // Custom Dimension for grouping per case
        );
      }
    };

    return () => {
      sendTimeSpentEvent();
      startTimeRef.current = Date.now();
    };
  }, [location.pathname]);
};

export default usePiwikTrackPageTime;
