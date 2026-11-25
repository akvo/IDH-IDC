import React from "react";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { message } from "antd";
import InvitationRegister from "../InvitationRegister";
import { api } from "../../../lib";

jest.mock("../../../lib/api", () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

jest.mock("../../../store/static", () => ({
  ...jest.requireActual("../../../store/static"),
  commodityNameOptions: [{ label: "Cocoa", value: "Cocoa" }],
}));

const TOKEN = "invite-token-123";

const invitation = {
  id: 7,
  fullname: "Jane van der Berg",
  email: "jane@olam.com",
  role: "user",
  invitation_id: TOKEN,
};

const LoginStub = () => {
  const { state } = useLocation();
  return (
    <div data-testid="login-page">
      {state?.accountReady ? "account-ready" : "no-state"}
    </div>
  );
};

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={[`/invitation/${TOKEN}`]}>
      <Routes>
        <Route path="/invitation/:tokenId" element={<InvitationRegister />} />
        <Route path="/login" element={<LoginStub />} />
      </Routes>
    </MemoryRouter>
  );

const mockInvitation = (data = invitation) =>
  api.get.mockImplementation((url) =>
    Promise.resolve({ data: url === "company/options" ? [] : data })
  );

const chooseOption = async (label, optionText) => {
  const select = screen.getByLabelText(label).closest(".ant-select");
  fireEvent.mouseDown(select.querySelector(".ant-select-selector"));
  fireEvent.click(
    await screen.findByText(optionText, {
      selector: ".ant-select-item-option-content",
    })
  );
};

const fillForm = async () => {
  fireEvent.change(screen.getByTestId("input-company-name"), {
    target: { value: "Olam" },
  });
  await chooseOption("Sector*", "Agriculture");
  await chooseOption("Region*", "West Africa");
  await chooseOption("Commodities*", "Cocoa");
  fireEvent.change(screen.getByTestId("input-password"), {
    target: { value: "Password123!" },
  });
};

const submit = () =>
  fireEvent.click(screen.getByTestId("button-create-account"));

const completeForm = async () => {
  await fillForm();
  submit();
};

const waitForInvitation = () =>
  waitFor(() =>
    expect(screen.getByTestId("input-fullname")).toHaveValue(
      "Jane van der Berg"
    )
  );

describe("InvitationRegister (IDC invited user)", () => {
  let toastError;

  beforeEach(() => {
    jest.clearAllMocks();
    toastError = jest.spyOn(message, "error").mockImplementation(() => {});
    mockInvitation();
    api.post.mockResolvedValue({ data: { access_token: "token" } });
  });

  afterEach(() => {
    toastError.mockRestore();
  });

  it("loads the invitation and shows the design's fields", async () => {
    renderComponent();

    expect(
      screen.getByRole("heading", { name: "Create your account" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/IDH invited you to the Income Driver Calculator/)
    ).toBeInTheDocument();

    await waitForInvitation();
    expect(api.get).toHaveBeenCalledWith(`user/invitation/${TOKEN}`);
    [
      "Name*",
      "Organisation*",
      "Sector*",
      "Region*",
      "Commodities*",
      "Password*",
    ].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
    // The email comes from the invitation and company type is not asked
    expect(screen.queryByTestId("input-email")).toBeNull();
    expect(screen.queryByLabelText("Company type*")).toBeNull();
    expect(screen.queryByTestId("checkbox-data-security")).toBeNull();
  });

  it("asks for both a first and a last name", async () => {
    renderComponent();
    await waitForInvitation();
    fireEvent.change(screen.getByTestId("input-fullname"), {
      target: { value: "Jane" },
    });
    await fillForm();
    submit();

    expect(
      await screen.findByText("Please enter your first and last name")
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("asks for a name when it is cleared", async () => {
    renderComponent();
    await waitForInvitation();
    fireEvent.change(screen.getByTestId("input-fullname"), {
      target: { value: "  " },
    });
    await fillForm();
    submit();

    expect(
      await screen.findByText("Please enter your name")
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("ignores an invitation that loads after leaving the page", async () => {
    let resolveInvitation;
    api.get.mockImplementation((url) =>
      url === "company/options"
        ? Promise.resolve({ data: [] })
        : new Promise((resolve) => {
            resolveInvitation = resolve;
          })
    );
    const { unmount } = renderComponent();
    unmount();

    await act(async () => resolveInvitation({ data: invitation }));
    expect(screen.queryByTestId("input-fullname")).toBeNull();
  });

  it("pre-fills the company when the invitation has one", async () => {
    mockInvitation({ ...invitation, company_name: "Olam International" });
    renderComponent();

    await waitFor(() =>
      expect(screen.getByTestId("input-company-name")).toHaveValue(
        "Olam International"
      )
    );
  });

  it("explains an expired or used invitation", async () => {
    api.get.mockImplementation((url) =>
      url === "company/options"
        ? Promise.resolve({ data: [] })
        : Promise.reject({ response: { status: 404 } })
    );
    renderComponent();

    expect(await screen.findByTestId("invitation-invalid")).toHaveTextContent(
      "This invitation link has expired or has already been used."
    );
    expect(screen.getByTestId("button-create-account")).not.toBeVisible();
  });

  it("completes the account and sends the user to log in", async () => {
    renderComponent();
    await waitForInvitation();
    await completeForm();

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        `user/complete-invitation/${TOKEN}`,
        {
          first_name: "Jane",
          last_name: "van der Berg",
          password: "Password123!",
          company_name: "Olam",
          sector: "Agriculture",
          region_name: "West Africa",
          commodities: ["Cocoa"],
        }
      )
    );
    expect(await screen.findByTestId("login-page")).toHaveTextContent(
      "account-ready"
    );
  });

  it("switches to the expired message when the token dies before submit", async () => {
    api.post.mockRejectedValueOnce({ response: { status: 404 } });
    renderComponent();
    await waitForInvitation();
    await completeForm();

    expect(await screen.findByTestId("invitation-invalid")).toBeInTheDocument();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("shows other API errors and keeps the form", async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { detail: [{ msg: "Password must contain at least one digit" }] },
      },
    });
    renderComponent();
    await waitForInvitation();
    await completeForm();

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Password must contain at least one digit"
      )
    );
    expect(screen.getByTestId("button-create-account")).toBeVisible();
  });

  it("falls back to a generic message when the API gives no detail", async () => {
    api.post.mockRejectedValueOnce({ response: { status: 500 } });
    renderComponent();
    await waitForInvitation();
    await completeForm();

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "We couldn’t create your account. Try again."
      )
    );
  });
});
