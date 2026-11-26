import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import RedirectWithSearch from "../RedirectWithSearch";

const Target = () => {
  const { pathname, search, hash } = useLocation();
  return <div data-testid="target">{`${pathname}${search}${hash}`}</div>;
};

describe("RedirectWithSearch", () => {
  it("moves to the new path and keeps the query string and hash", () => {
    render(
      <MemoryRouter initialEntries={["/academy/account?edit=1#name"]}>
        <Routes>
          <Route
            path="/academy/account"
            element={<RedirectWithSearch to="/academy/profile" />}
          />
          <Route path="/academy/profile" element={<Target />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("target")).toHaveTextContent(
      "/academy/profile?edit=1#name"
    );
  });
});
