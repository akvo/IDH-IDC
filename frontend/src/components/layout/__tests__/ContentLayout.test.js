import { render, waitFor, act } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import ContentLayout from "../ContentLayout";
import { UserState } from "../../../store";

const mockedUseNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedUseNavigate,
}));

const organisation_detail = {
  id: 1,
  name: "Akvo",
};
const business_unit_detail = [
  {
    id: 1,
    name: "Meat Guy",
    role: "admin",
  },
];

describe("ContentLayout component", () => {
  it("should render correctly", async () => {
    const wrapper = render(
      <Router>
        <ContentLayout
          breadcrumbItems={[{ title: "Breadcrumb" }]}
          title="Title"
          subTitle="Lorem ipsum sit dolor..."
        >
          <h1>Hello world!</h1>
        </ContentLayout>
      </Router>
    );
    waitFor(() => {
      expect(wrapper.getByText("Breadcrumb").toBeInTheDocument());
      expect(wrapper.getByText("Title").toBeInTheDocument());
      expect(wrapper.getByText("Lorem ipsum sit dolor...").toBeInTheDocument());
      expect(wrapper.getByText("Hello world!").toBeInTheDocument());
    });
  });

  it("should not render breadcrumb if not defined", async () => {
    const wrapper = render(
      <Router>
        <ContentLayout title="Title" subTitle="Lorem ipsum sit dolor...">
          <h1>Hello world!</h1>
        </ContentLayout>
      </Router>
    );
    waitFor(() => {
      expect(wrapper.getByTestId("breadcrumb").not.toBeInTheDocument());
      expect(wrapper.getByTestId("title").toBeInTheDocument());
      expect(wrapper.getByTestId("subTitle").toBeInTheDocument());
    });
  });

  it("should not render title & subTitle if not defined", async () => {
    const wrapper = render(
      <Router>
        <ContentLayout breadcrumbItems={[{ title: "Breadcrumb" }]}>
          <h1>Hello world!</h1>
        </ContentLayout>
      </Router>
    );
    waitFor(() => {
      expect(wrapper.getByTestId("breadcrumb").toBeInTheDocument());
      expect(wrapper.getByTestId("title").not.toBeInTheDocument());
      expect(wrapper.getByTestId("subTitle").not.toBeInTheDocument());
    });
  });

  it("should not render page title section if breadcrumb, title and subTitle not defined", async () => {
    const wrapper = render(
      <Router>
        <ContentLayout>
          <h1>Hello world!</h1>
        </ContentLayout>
      </Router>
    );
    waitFor(() => {
      expect(wrapper.getByTestId("breadcrumb").not.toBeInTheDocument());
      expect(wrapper.getByTestId("title").not.toBeInTheDocument());
      expect(wrapper.getByTestId("subTitle").not.toBeInTheDocument());
    });
  });

  it("should not render admin tabs menu if not admin user role", async () => {
    const wrapper = render(
      <Router>
        <ContentLayout>
          <h1>Hello world!</h1>
        </ContentLayout>
      </Router>
    );

    waitFor(() => {
      expect(wrapper.getByTestId("admin-tabs-menu").not.toBeInTheDocument());
    });
  });

  it("should render admin tabs menu if admin user role", async () => {
    global.window.location = {
      ancestorOrigins: null,
      hash: null,
      host: "dummy.com",
      port: "80",
      protocol: "http:",
      hostname: "dummy.com",
      href: "http://dummy.com?page=1&name=testing",
      origin: "http://dummy.com",
      pathname: "/admin/users",
      search: null,
      assign: null,
      reload: null,
      replace: null,
    };

    const wrapper = render(
      <Router>
        <ContentLayout>
          <h1>Hello world!</h1>
        </ContentLayout>
      </Router>
    );

    act(() => {
      UserState.update((s) => {
        s.id = 1;
        s.fullname = "John Doe";
        s.email = "admin@akvo.com";
        s.role = "admin";
        s.active = true;
        s.organisation_detail = organisation_detail;
        s.business_unit_detail = business_unit_detail;
        s.tags_count = 2;
        s.cases_count = 1;
        s.case_access = [];
        s.internal_user = false;
      });
    });

    waitFor(() => {
      expect(wrapper.getByTestId("admin-tabs-menu").toBeInTheDocument());
    });
  });
});
