import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const useMatomoPageView = () => {
  const location = useLocation();
  const previousPathRef = useRef(null);

  useEffect(() => {
    if (!window._paq) return;

    // Prevent duplicate tracking (React 18 StrictMode safe)
    if (previousPathRef.current === location.pathname) return;
    previousPathRef.current = location.pathname;

    window._paq.push(["setCustomUrl", location.pathname]);
    window._paq.push(["setDocumentTitle", document.title]);
    window._paq.push(["trackPageView"]);
  }, [location.pathname]);
};

export default useMatomoPageView;
