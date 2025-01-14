test.todo("it should");
// import { render, act, fireEvent } from "@testing-library/react";
// import { BrowserRouter as Router } from "react-router-dom";
// import { PageLayout } from "../../../components/layout";
// import Welcome from "../Welcome";
// import { UserState } from "../../../store";

// const mockedUseNavigate = jest.fn();
// jest.mock("react-router-dom", () => ({
//   ...jest.requireActual("react-router-dom"),
//   useNavigate: () => mockedUseNavigate,
// }));

// const organisation_detail = {
//   id: 1,
//   name: "Akvo",
// };
// const business_unit_detail = [
//   {
//     id: 1,
//     name: "Meat Guy",
//     role: "admin",
//   },
// ];

// describe("Welcome page", () => {
//   it("should render navigation menu for non admin user", () => {
//     const { getByTestId, queryByTestId } = render(
//       <Router>
//         <PageLayout>
//           <Welcome />
//         </PageLayout>
//       </Router>
//     );

//     act(() => {
//       UserState.update((s) => {
//         s.id = 1;
//         s.fullname = "John Doe";
//         s.email = "user@akvo.com";
//         s.role = "user";
//         s.active = true;
//         s.organisation_detail = organisation_detail;
//         s.business_unit_detail = business_unit_detail;
//         s.tags_count = 2;
//         s.cases_count = 1;
//         s.case_access = [{ case: 1, permission: "edit" }];
//         s.internal_user = true;
//       });
//     });

//     expect(getByTestId("nav-menu-cases")).toBeInTheDocument();
//     expect(getByTestId("nav-menu-explore-studies")).toBeInTheDocument();
//     expect(queryByTestId("nav-menu-admin")).not.toBeInTheDocument();
//   });

//   it("should render navigation menu for admin user", () => {
//     const { getByTestId } = render(
//       <Router>
//         <PageLayout>
//           <Welcome />
//         </PageLayout>
//       </Router>
//     );

//     act(() => {
//       UserState.update((s) => {
//         s.id = 1;
//         s.fullname = "John Doe";
//         s.email = "admin@akvo.com";
//         s.role = "admin";
//         s.active = true;
//         s.organisation_detail = organisation_detail;
//         s.business_unit_detail = business_unit_detail;
//         s.tags_count = 2;
//         s.cases_count = 1;
//         s.case_access = [{ case: 1, permission: "edit" }];
//         s.internal_user = false;
//       });
//     });

//     expect(getByTestId("nav-menu-cases")).toBeInTheDocument();
//     expect(getByTestId("nav-menu-explore-studies")).toBeInTheDocument();
//     expect(getByTestId("nav-menu-admin")).toBeInTheDocument();
//   });

//   it("should render welcome title and subtitle", () => {
//     const { getByTestId } = render(
//       <Router>
//         <PageLayout>
//           <Welcome />
//         </PageLayout>
//       </Router>
//     );
//     expect(getByTestId("page-title")).toBeInTheDocument();
//     expect(getByTestId("page-subtitle")).toBeInTheDocument();
//   });

//   it("should render cases and explore studies card menu for all user role", () => {
//     const { getByTestId, queryByTestId } = render(
//       <Router>
//         <PageLayout>
//           <Welcome />
//         </PageLayout>
//       </Router>
//     );

//     act(() => {
//       UserState.update((s) => {
//         s.id = 1;
//         s.fullname = "John Doe";
//         s.email = "user@akvo.com";
//         s.role = "user";
//         s.active = true;
//         s.organisation_detail = organisation_detail;
//         s.business_unit_detail = business_unit_detail;
//         s.tags_count = 2;
//         s.cases_count = 1;
//         s.case_access = [{ case: 1, permission: "edit" }];
//         s.internal_user = true;
//       });
//     });

//     expect(getByTestId("card-menu-cases")).toBeInTheDocument();
//     expect(getByTestId("card-menu-cases-icon")).toBeInTheDocument();
//     expect(getByTestId("card-menu-cases-name")).toBeInTheDocument();
//     expect(getByTestId("card-menu-cases-description")).toBeInTheDocument();
//     expect(getByTestId("card-menu-cases-button")).toBeInTheDocument();

//     expect(getByTestId("card-menu-explore-studies")).toBeInTheDocument();
//     expect(getByTestId("card-menu-explore-studies-icon")).toBeInTheDocument();
//     expect(getByTestId("card-menu-explore-studies-name")).toBeInTheDocument();
//     expect(
//       getByTestId("card-menu-explore-studies-description")
//     ).toBeInTheDocument();
//     expect(getByTestId("card-menu-explore-studies-button")).toBeInTheDocument();

//     expect(queryByTestId("card-menu-admin")).not.toBeInTheDocument();
//   });

//   it("should render admin card menu only for super admin and admin role", () => {
//     const { getByTestId } = render(
//       <Router>
//         <PageLayout>
//           <Welcome />
//         </PageLayout>
//       </Router>
//     );

//     act(() => {
//       UserState.update((s) => {
//         s.id = 1;
//         s.fullname = "John Doe";
//         s.email = "admin@akvo.com";
//         s.role = "admin";
//         s.active = true;
//         s.organisation_detail = organisation_detail;
//         s.business_unit_detail = business_unit_detail;
//         s.tags_count = 2;
//         s.cases_count = 1;
//         s.case_access = [{ case: 1, permission: "edit" }];
//         s.internal_user = false;
//       });
//     });

//     expect(getByTestId("card-menu-cases")).toBeInTheDocument();
//     expect(getByTestId("card-menu-cases-icon")).toBeInTheDocument();
//     expect(getByTestId("card-menu-cases-name")).toBeInTheDocument();
//     expect(getByTestId("card-menu-cases-description")).toBeInTheDocument();
//     expect(getByTestId("card-menu-cases-button")).toBeInTheDocument();

//     expect(getByTestId("card-menu-explore-studies")).toBeInTheDocument();
//     expect(getByTestId("card-menu-explore-studies-icon")).toBeInTheDocument();
//     expect(getByTestId("card-menu-explore-studies-name")).toBeInTheDocument();
//     expect(
//       getByTestId("card-menu-explore-studies-description")
//     ).toBeInTheDocument();
//     expect(getByTestId("card-menu-explore-studies-button")).toBeInTheDocument();

//     expect(getByTestId("card-menu-admin")).toBeInTheDocument();
//     expect(getByTestId("card-menu-admin-icon")).toBeInTheDocument();
//     expect(getByTestId("card-menu-admin-name")).toBeInTheDocument();
//     expect(getByTestId("card-menu-admin-description")).toBeInTheDocument();
//     expect(getByTestId("card-menu-admin-button")).toBeInTheDocument();
//   });

//   it("should go to cases page if Cases menu clicked", () => {
//     const { getByTestId } = render(
//       <Router>
//         <PageLayout>
//           <Welcome />
//         </PageLayout>
//       </Router>
//     );

//     act(() => {
//       UserState.update((s) => {
//         s.id = 1;
//         s.fullname = "John Doe";
//         s.email = "admin@akvo.com";
//         s.role = "admin";
//         s.active = true;
//         s.organisation_detail = organisation_detail;
//         s.business_unit_detail = business_unit_detail;
//         s.tags_count = 2;
//         s.cases_count = 1;
//         s.case_access = [{ case: 1, permission: "edit" }];
//         s.internal_user = false;
//       });
//     });

//     const casesCardMenuButton = getByTestId("card-menu-cases-button");
//     fireEvent.click(casesCardMenuButton);
//     expect(mockedUseNavigate).toHaveBeenCalledWith("/old-cases");
//   });

//   it("should go to explore studies page if Explore Studies menu clicked", () => {
//     const { getByTestId } = render(
//       <Router>
//         <PageLayout>
//           <Welcome />
//         </PageLayout>
//       </Router>
//     );

//     act(() => {
//       UserState.update((s) => {
//         s.id = 1;
//         s.fullname = "John Doe";
//         s.email = "admin@akvo.com";
//         s.role = "admin";
//         s.active = true;
//         s.organisation_detail = organisation_detail;
//         s.business_unit_detail = business_unit_detail;
//         s.tags_count = 2;
//         s.cases_count = 1;
//         s.case_access = [{ case: 1, permission: "edit" }];
//         s.internal_user = false;
//       });
//     });

//     const exploreCardMenuButton = getByTestId(
//       "card-menu-explore-studies-button"
//     );
//     fireEvent.click(exploreCardMenuButton);
//     expect(mockedUseNavigate).toHaveBeenCalledWith("/explore");
//   });

//   it("should go to admin page if Admin menu clicked", () => {
//     const { getByTestId } = render(
//       <Router>
//         <PageLayout>
//           <Welcome />
//         </PageLayout>
//       </Router>
//     );

//     act(() => {
//       UserState.update((s) => {
//         s.id = 1;
//         s.fullname = "John Doe";
//         s.email = "admin@akvo.com";
//         s.role = "admin";
//         s.active = true;
//         s.organisation_detail = organisation_detail;
//         s.business_unit_detail = business_unit_detail;
//         s.tags_count = 2;
//         s.cases_count = 1;
//         s.case_access = [{ case: 1, permission: "edit" }];
//         s.internal_user = false;
//       });
//     });

//     const adminCardMenuButton = getByTestId("card-menu-admin-button");
//     fireEvent.click(adminCardMenuButton);
//     expect(mockedUseNavigate).toHaveBeenCalledWith("/admin/users");
//   });
// });
