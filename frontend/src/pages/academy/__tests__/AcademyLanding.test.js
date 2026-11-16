import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Modal } from "antd";
import AcademyLanding from "../AcademyLanding";

describe("AcademyLanding Component", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = (initialEntry = "/academy") =>
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <AcademyLanding />
      </MemoryRouter>
    );

  it("renders the Hero section with headline and CTA button", () => {
    renderComponent();
    expect(
      screen.getByText(/expertise what drives living income impact/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /explore the academy/i })
    ).toBeInTheDocument();
  });

  it("renders the About section with 4 structured progression steps", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", {
        name: /what is the living income academy/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/foundations of living income/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/materiality and prioritization/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/measuring income gaps/i)).toBeInTheDocument();
    expect(
      screen.getByText(/designing living income programs/i)
    ).toBeInTheDocument();
  });

  it("renders the Roadmap on Living Income section with 5 stages", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: /roadmap on living income/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/laying the groundwork/i)).toBeInTheDocument();
    expect(screen.getByText(/measuring [&+] analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/building the business case/i)).toBeInTheDocument();
    expect(screen.getByText(/implementing solutions/i)).toBeInTheDocument();
    expect(
      screen.getByText(/reporting [&+] sharing insights/i)
    ).toBeInTheDocument();
  });

  it("renders the CTA Banner section with Start Learning button", () => {
    renderComponent();
    expect(
      screen.getByText(/ready to accelerate your living income journey\?/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start learning/i })
    ).toBeInTheDocument();
  });

  it("renders the Tools and resources section with 3 tool cards", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: /tools and resources/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /income measurement guidance tool/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /cocoa income inventory/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /procurement library/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /explore all resources/i })
    ).toBeInTheDocument();
  });

  it("renders the Collaboration partners section with accredited partners", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: /collaboration partners/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sustainable food lab, licop and akvo/i)
    ).toBeInTheDocument();
  });

  it("renders the FooterDisclaimer with academy specific text", () => {
    renderComponent();
    expect(
      screen.getByText(/the living income academy offers general guidance/i)
    ).toBeInTheDocument();
  });

  it("does not open unauthorized IDC access modal when navigation state is absent", () => {
    const infoSpy = jest.spyOn(Modal, "info").mockImplementation(jest.fn());
    renderComponent();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("opens IDH access request modal when redirected with unauthorizedIDC state", () => {
    const infoSpy = jest.spyOn(Modal, "info").mockImplementation(jest.fn());
    renderComponent({
      pathname: "/academy",
      state: { unauthorizedIDC: true },
    });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Income Driver Calculator Access",
        className: "access-request-modal",
      })
    );
  });

  it("navigates to /academy/overview when Explore the Academy is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/academy"]}>
        <Routes>
          <Route path="/academy" element={<AcademyLanding />} />
          <Route
            path="/academy/overview"
            element={<div>Academy Overview Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole("button", { name: /explore the academy/i })
    );

    expect(screen.getByText("Academy Overview Page")).toBeInTheDocument();
  });
});
