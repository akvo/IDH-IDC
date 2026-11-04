import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AcademyLanding from "../AcademyLanding";

describe("AcademyLanding Component", () => {
  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={["/academy"]}>
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
});
