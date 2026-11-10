import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { message } from "antd";
import AcademyLayout from "../AcademyLayout";
import { getActiveMenuKey } from "../AcademySidebar";
import { routePath } from "../../../../components/route";

const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
};

const renderLayout = (initialPath = routePath.academy.overview) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AcademyLayout />}>
          <Route
            path="/academy/*"
            element={<div data-testid="academy-child">Child page</div>}
          />
        </Route>
        <Route path="*" element={<div data-testid="outside">Outside</div>} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  );

const getSelectedItemText = () =>
  Array.from(document.querySelectorAll(".ant-menu-item-selected")).map(
    (el) => el.textContent
  );

const submitQuickSearch = (value) => {
  const input = screen.getByPlaceholderText("Quick Search");
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: "Enter", code: "Enter", keyCode: 13 });
};

describe("AcademyLayout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the sidebar, help card, footer, chatbot and child page", () => {
    renderLayout();

    expect(screen.getByTestId("academy-sidebar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Quick Search")).toBeInTheDocument();
    [
      "My overview",
      "Course Overview",
      "Academy resources",
      "Account",
      "Settings",
    ].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.getByText("Need help?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /get help/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("academy-footer")).toBeInTheDocument();
    expect(screen.getByAltText("IDH logo")).toBeInTheDocument();
    expect(screen.getByTestId("academy-chatbot-button")).toBeInTheDocument();
    expect(screen.getByTestId("academy-child")).toBeInTheDocument();
  });

  it.each([
    [routePath.academy.overview, "My overview"],
    [routePath.academy.courses, "Course Overview"],
    [`${routePath.academy.courses}/chapter/5`, "Course Overview"],
    [routePath.academy.resources, "Academy resources"],
    [routePath.academy.account, "Account"],
    [routePath.academy.settings, "Settings"],
  ])("highlights only the active item for %s", (path, label) => {
    renderLayout(path);
    expect(getSelectedItemText()).toEqual([label]);
  });

  it("highlights nothing for an academy path without a menu item", () => {
    renderLayout("/academy/unknown");
    expect(getSelectedItemText()).toEqual([]);
  });

  it("navigates and moves the highlight when a sidebar item is clicked", () => {
    renderLayout();
    fireEvent.click(screen.getByText("Settings"));
    expect(screen.getByTestId("location")).toHaveTextContent(
      routePath.academy.settings
    );
    expect(getSelectedItemText()).toEqual(["Settings"]);
  });

  it("sends trimmed, encoded quick search keywords to the course overview", () => {
    renderLayout();
    submitQuickSearch("  income & gap ");
    expect(screen.getByTestId("location")).toHaveTextContent(
      `${routePath.academy.courses}?search=income%20%26%20gap`
    );
  });

  it("ignores a blank quick search", () => {
    renderLayout();
    submitQuickSearch("   ");
    expect(screen.getByTestId("location")).toHaveTextContent(
      routePath.academy.overview
    );
  });

  it("sends Get help to the FAQ page", () => {
    renderLayout();
    fireEvent.click(screen.getByRole("button", { name: /get help/i }));
    expect(screen.getByTestId("location")).toHaveTextContent(routePath.idc.faq);
  });

  it("shows a coming-soon notice from the chatbot button", () => {
    const info = jest.spyOn(message, "info").mockImplementation(() => {});
    renderLayout();
    fireEvent.click(
      screen.getByRole("button", { name: /open academy facilitator chat/i })
    );
    expect(info).toHaveBeenCalledWith(
      "The Academy facilitator chat is coming soon."
    );
  });
});

describe("getActiveMenuKey", () => {
  it("matches exact and nested paths but not lookalike prefixes", () => {
    expect(getActiveMenuKey("/academy/overview")).toBe("/academy/overview");
    expect(getActiveMenuKey("/academy/courses/chapter/1")).toBe(
      "/academy/courses"
    );
    expect(getActiveMenuKey("/academy/coursesxyz")).toBeUndefined();
    expect(getActiveMenuKey("/academy")).toBeUndefined();
    expect(getActiveMenuKey()).toBeUndefined();
  });
});
