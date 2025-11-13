import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if there's a hash in the URL (e.g., #sourcing-strategy-cycle-content)
    if (location.hash) {
      // Use setTimeout to ensure the element is rendered before we try to scroll to it
      // which is important for dynamically loaded content or new page loads.
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1)); // Remove the '#'
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 0); // Run immediately after the browser finishes rendering the page update
    }
  }, [location]); // Rerun this effect every time the location changes

  return null; // This component renders nothing
};

export default ScrollToHash;
