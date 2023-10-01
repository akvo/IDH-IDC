import React from "react";
import { render, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Cookies } from "react-cookie";
import { UserState } from "../../../store";
import PrivateRoutes from "../PrivateRoutes";

describe("PrivateRoutes Component", () => {
  it("redirects to /login when authToken is not available", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route path="/private" element={<div testid="private-route" />} />
          </Route>
          <Route path="/login" element={<div>Mock Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("Mock Login Page")).toBeInTheDocument();
  });

  it("renders Outlet when authToken and user info are available", () => {
    const cookies = new Cookies();
    act(() => {
      cookies.set("AUTH_TOKEN", "yourAuthToken");
      UserState.update((s) => {
        s.id = 1;
        s.active = true;
      });
    });

    const { getByText } = render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route path="/private" element={<div>Mock Private Route</div>} />
          </Route>
          <Route path="/login" element={<div>Mock Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("Mock Private Route")).toBeInTheDocument();
  });
});
