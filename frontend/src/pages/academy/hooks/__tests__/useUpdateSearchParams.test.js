import React from "react";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation, useSearchParams } from "react-router-dom";
import useUpdateSearchParams from "../useUpdateSearchParams";

const renderUpdater = (path) => {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );
  return renderHook(
    () => {
      const [, setSearchParams] = useSearchParams();
      return {
        update: useUpdateSearchParams(setSearchParams),
        location: useLocation(),
      };
    },
    { wrapper }
  );
};

describe("useUpdateSearchParams", () => {
  it("sets truthy values, removes falsy ones and keeps the rest", () => {
    const { result } = renderUpdater("/page?tab=glossary&search=old&type=Core");

    act(() => result.current.update({ search: "new", type: null }));

    expect(result.current.location.search).toBe("?tab=glossary&search=new");
  });

  it("passes options through, e.g. replacing the history entry", () => {
    const { result } = renderUpdater("/page?chapter=5");
    const before = result.current.location.key;

    act(() => result.current.update({ chapter: null }, { replace: true }));

    expect(result.current.location.search).toBe("");
    expect(result.current.location.key).not.toBe(before);
  });

  it("keeps the same function across URL changes", () => {
    const { result } = renderUpdater("/page");
    const first = result.current.update;

    act(() => first({ tab: "glossary" }));
    act(() => result.current.update({ search: "gap" }));

    expect(result.current.update).toBe(first);
    // Still writes onto the latest URL, not the one it was created with
    expect(result.current.location.search).toBe("?tab=glossary&search=gap");
  });
});
