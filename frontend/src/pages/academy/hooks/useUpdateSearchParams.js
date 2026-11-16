import { useCallback, useLayoutEffect, useRef } from "react";

// Returns `updateParams(changes, options)`, which merges `changes` into the
// current query string: a truthy value sets the key, a falsy one removes it.
// `options` go to react-router's setSearchParams (e.g. { replace: true }).
//
// The returned function never changes. react-router gives setSearchParams a
// new identity on every URL change, which would otherwise re-create every
// handler built on it and re-render memoised children (tables, accordions).
// It is safe to hold the latest one in a ref: the updater reads the query
// string at call time, not from this render.
const useUpdateSearchParams = (setSearchParams) => {
  const latest = useRef(setSearchParams);
  useLayoutEffect(() => {
    latest.current = setSearchParams;
  }, [setSearchParams]);

  return useCallback(
    (changes, options) =>
      latest.current((current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key)
        );
        return next;
      }, options),
    []
  );
};

export default useUpdateSearchParams;
