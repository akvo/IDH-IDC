import { useState, useEffect, useCallback } from "react";

const useWindowDimensions = (breakpoint = 768) => {
  const getDimensions = useCallback(
    () => ({
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      isMobile: window.innerWidth < breakpoint,
    }),
    [breakpoint]
  );

  const [dimensions, setDimensions] = useState(getDimensions);

  useEffect(() => {
    const handleResize = () => {
      setDimensions(getDimensions());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint, getDimensions]);

  return dimensions;
};

export default useWindowDimensions;
