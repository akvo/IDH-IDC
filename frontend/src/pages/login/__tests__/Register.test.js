import React from "react";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { message } from "antd";
import Register, { RESEND_COOLDOWN_MS } from "../Register";
import { api } from "../../../lib";

jest.mock("../../../lib/api", () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

jest.mock("../../../store/static", () => ({
  ...jest.requireActual("../../../store/static"),
  commodityNameOptions: [
    { label: "Cocoa", value: "Cocoa" },
    { label: "Coffee", value: "Coffee" },
  ],
}));

// Lets pending fetches and async form validation finish inside act()
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve)));

const renderComponent = async () => {
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Register />
    </MemoryRouter>
  );
  await settle();
};

const type = (testId, value) =>
  fireEvent.change(screen.getByTestId(testId), { target: { value } });

const chooseOption = async (label, optionText) => {
  const select = screen.getByLabelText(label).closest(".ant-select");
  fireEvent.mouseDown(select.querySelector(".ant-select-selector"));
  fireEvent.click(
    await screen.findByText(optionText, {
      selector: ".ant-select-item-option-content",
    })
  );
};

const fillValidForm = async () => {
  type("input-first-name", "Jane");
  type("input-last-name", "Doe");
  type("input-email", " jane@coop.org ");
  type("input-password", "Password123!");
  type("input-company-name", "Coop Western");
  await chooseOption("Company type*", "Cooperative / Farmer Organization");
  await chooseOption("Sector*", "Agriculture");
  await chooseOption("Region*", "West Africa");
  await chooseOption("Commodities*", "Cocoa");
  await chooseOption("Commodities*", "Coffee");
  fireEvent.click(screen.getByTestId("checkbox-data-security"));
};

const submit = () => fireEvent.click(screen.getByTestId("button-register"));

describe("Register (Academy self sign-up)", () => {
  let toastError;

  beforeEach(() => {
    jest.clearAllMocks();
    toastError = jest.spyOn(message, "error").mockImplementation(() => {});
    api.get.mockResolvedValue({
      data: [
        { value: 1, label: "Coop Western" },
        { value: 2, label: "Olam" },
      ],
    });
    api.post.mockResolvedValue({ data: { message: "ok" } });
  });

  afterEach(() => {
    toastError.mockRestore();
  });

  it("renders the sign-up form and the Toolkit info cards", async () => {
    await renderComponent();

    expect(
      screen.getByRole("heading", { name: "No account yet?" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Creating an account is free and takes a few minutes/, {
        selector: ".login-intro-copy",
      })
    ).toBeInTheDocument();
    [
      "First name*",
      "Last name*",
      "Email*",
      "Password*",
      "Company name*",
      "Company type*",
      "Sector*",
      "Region*",
      "Commodities*",
    ].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Get started" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("link-login")).toHaveAttribute("href", "/login");

    const cards = within(screen.getByTestId("additional-text-block"));
    expect(cards.getByText("Living Income Academy")).toBeInTheDocument();
    expect(cards.getByText("(invitation only)")).toBeInTheDocument();
    expect(
      cards.getByText(/An IDC account also gives you access/)
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("company/options")
    );
  });

  it("suggests existing organisations while typing", async () => {
    await renderComponent();
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    const input = screen.getByTestId("input-company-name");
    fireEvent.focus(input);
    type("input-company-name", "coop");

    expect(
      await screen.findByText("Coop Western", {
        selector: ".ant-select-item-option-content",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Olam", {
        selector: ".ant-select-item-option-content",
      })
    ).toBeNull();
  });

  it("updates the password hint as the user types", async () => {
    await renderComponent();
    const hint = screen.getByTestId("password-hint");
    expect(hint).toHaveTextContent(
      "At least 8 characters, with an uppercase and a lowercase letter, a number and a symbol."
    );

    type("input-password", "abc");
    expect(hint).toHaveTextContent(
      "Still needed: an uppercase letter, a number, a symbol, at least 8 characters."
    );

    type("input-password", "Password123!");
    expect(hint).toHaveTextContent("Meets all the password rules.");
    await settle();
  });

  it("blocks submission until every required field is valid", async () => {
    await renderComponent();
    type("input-email", "not-an-email");
    type("input-password", "weak");
    submit();

    expect(
      await screen.findByText("Please enter your first name")
    ).toBeInTheDocument();
    [
      "Please enter your last name",
      "Please enter a valid email address",
      "The password doesn’t meet the rules",
      "Please enter your organisation",
      "Please select a company type",
      "Please select a sector",
      "Please select a region",
      "Please select at least one commodity",
      "Please agree to the Data Security Provision",
    ].forEach((error) => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it("registers, clears the form and asks to confirm the email", async () => {
    await renderComponent();
    await fillValidForm();
    submit();

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("user/register-academy", {
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@coop.org",
        password: "Password123!",
        company_name: "Coop Western",
        company_type: "Cooperative / Farmer Organization",
        sector: "Agriculture",
        region_name: "West Africa",
        commodities: ["Cocoa", "Coffee"],
      })
    );
    expect(await screen.findByTestId("login-alert-warning")).toHaveTextContent(
      "Please confirm your email address first. We sent a link to jane@coop.org when you signed up. Can’t find it? Check your spam folder or"
    );
    expect(screen.getByTestId("register-title")).toBeVisible();
    expect(screen.getByTestId("input-email")).toHaveValue("");
    expect(screen.getByTestId("input-first-name")).toHaveValue("");
  });

  it("resends the verification link, then waits 30 seconds", async () => {
    await renderComponent();
    await fillValidForm();
    submit();
    const resend = await screen.findByTestId("button-resend-verification");

    api.post.mockClear();
    jest.useFakeTimers();
    try {
      fireEvent.click(resend);

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith("user/resend-verification", {
          email: "jane@coop.org",
        })
      );
      expect(
        await screen.findByTestId("toast-resend-success")
      ).toHaveTextContent("We sent a new verification link to jane@coop.org.");
      // No new link can be requested during the cooldown
      expect(screen.queryByTestId("button-resend-verification")).toBeNull();

      act(() => jest.advanceTimersByTime(RESEND_COOLDOWN_MS - 1));
      expect(screen.queryByTestId("button-resend-verification")).toBeNull();

      act(() => jest.advanceTimersByTime(1));
      expect(
        screen.getByTestId("button-resend-verification")
      ).toBeInTheDocument();
      expect(api.post).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("goes back to the form to correct the email", async () => {
    await renderComponent();
    await fillValidForm();
    submit();
    await screen.findByTestId("login-alert-warning");
    expect(screen.getByTestId("link-toast-login")).toHaveAttribute(
      "href",
      "/login"
    );

    fireEvent.click(screen.getByTestId("button-change-email"));

    expect(screen.queryByTestId("login-alert-warning")).toBeNull();
    expect(screen.getByTestId("input-email")).toHaveValue("jane@coop.org");
    expect(screen.getByTestId("input-email")).toHaveFocus();
  });

  it("toasts a failed resend and lets the user try again", async () => {
    await renderComponent();
    await fillValidForm();
    submit();
    const resend = await screen.findByTestId("button-resend-verification");

    api.post.mockRejectedValueOnce({ response: { status: 500 } });
    fireEvent.click(resend);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "We couldn’t send a new link. Please try again."
      )
    );
    expect(screen.getByTestId("button-resend-verification")).not.toBeDisabled();
  });

  it("shows the API error when the email is already registered", async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { detail: "User jane@coop.org already exists." },
      },
    });
    await renderComponent();
    await fillValidForm();
    submit();

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "User jane@coop.org already exists."
      )
    );
    expect(screen.queryByTestId("login-alert-warning")).toBeNull();
  });

  it("shows the first validation message from a 422", async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { detail: [{ msg: "Company name cannot be empty" }] },
      },
    });
    await renderComponent();
    await fillValidForm();
    submit();

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Company name cannot be empty")
    );
  });
});
