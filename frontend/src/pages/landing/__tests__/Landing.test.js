import { render } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { PageLayout } from "../../../components/layout";
import Landing from "../Landing";

describe("Landing page", () => {
  it("should render page header with about us and login nav", () => {
    const wrapper = render(
      <Router>
        <PageLayout>
          <Landing />
        </PageLayout>
      </Router>
    );

    expect(wrapper.getByTestId("logo-image")).toBeInTheDocument();
    expect(wrapper.getByText("About IDC")).toBeInTheDocument();
    expect(wrapper.getByText("Sign in")).toBeInTheDocument();
  });

  it("should render jumbotron image with title, subtitle, and learn more button", () => {
    const wrapper = render(
      <Router>
        <PageLayout>
          <Landing />
        </PageLayout>
      </Router>
    );

    expect(wrapper.getByTestId("jumbotron-wrapper")).toBeInTheDocument();
    expect(wrapper.getByTestId("jumbotron-title")).toBeInTheDocument();
    expect(wrapper.getByTestId("jumbotron-subtitle")).toBeInTheDocument();
    expect(wrapper.getByTestId("button-learn-more")).toBeInTheDocument();
  });

  it("should render first section", () => {
    const wrapper = render(
      <Router>
        <PageLayout>
          <Landing />
        </PageLayout>
      </Router>
    );

    expect(
      wrapper.getByTestId("income-driver-framework-wrapper")
    ).toBeInTheDocument();
    expect(
      wrapper.getByTestId("income-driver-framework-left-text")
    ).toBeInTheDocument();
    expect(
      wrapper.getByTestId("income-driver-framework-right-text")
    ).toBeInTheDocument();
    expect(wrapper.getByTestId("button-learn-more-2")).toBeInTheDocument();
  });

  it("should render second section", () => {
    const wrapper = render(
      <Router>
        <PageLayout>
          <Landing />
        </PageLayout>
      </Router>
    );

    expect(
      wrapper.getByTestId("framework-drivers-wrapper")
    ).toBeInTheDocument();
    expect(wrapper.getByTestId("framework-drivers-title")).toBeInTheDocument();
    expect(wrapper.getByTestId("framework-drivers-image")).toBeInTheDocument();
  });

  it("should render third section", () => {
    const wrapper = render(
      <Router>
        <PageLayout>
          <Landing />
        </PageLayout>
      </Router>
    );

    expect(wrapper.getByTestId("third-section-wrapper")).toBeInTheDocument();
    expect(wrapper.getByTestId("third-section-title")).toBeInTheDocument();
    expect(wrapper.getByTestId("third-section-subtitle")).toBeInTheDocument();
    expect(wrapper.getByTestId("map")).toBeInTheDocument();
  });

  it("should render disclaimer section", () => {
    const wrapper = render(
      <Router>
        <PageLayout>
          <Landing />
        </PageLayout>
      </Router>
    );

    expect(
      wrapper.getByTestId("disclaimer-section-wrapper")
    ).toBeInTheDocument();
    expect(wrapper.getByTestId("disclaimer-section-title")).toBeInTheDocument();
    expect(
      wrapper.getByTestId("disclaimer-section-description")
    ).toBeInTheDocument();
  });
});
