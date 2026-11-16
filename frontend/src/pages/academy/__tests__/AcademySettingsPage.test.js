import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { message } from "antd";
import AcademySettingsPage from "../AcademySettingsPage";
import academyService from "../services/academy";

const mockSignOut = jest.fn();
jest.mock("../../../hooks/useSignOut", () => ({
  __esModule: true,
  default: () => mockSignOut,
}));
jest.mock("../services/academy", () => ({
  __esModule: true,
  default: {
    changePassword: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

const LocationDisplay = () => (
  <div data-testid="location">{useLocation().pathname}</div>
);

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/academy/settings"]}>
      <Routes>
        <Route path="/academy/settings" element={<AcademySettingsPage />} />
        <Route path="*" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );

const field = (label) => screen.getByLabelText(label);
const type = (label, value) =>
  fireEvent.change(field(label), { target: { value } });
const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "Update" }));
const fillValidForm = () => {
  type("Current password", "old-password");
  type("New password", "a-much-longer-secret");
  type("Confirm new password", "a-much-longer-secret");
};

describe("AcademySettingsPage", () => {
  let toastSuccess;
  let toastError;

  beforeEach(() => {
    jest.clearAllMocks();
    toastSuccess = jest.spyOn(message, "success").mockImplementation(() => {});
    toastError = jest.spyOn(message, "error").mockImplementation(() => {});
    academyService.changePassword.mockResolvedValue({
      message: "Password changed successfully",
    });
    academyService.deleteAccount.mockResolvedValue({});
  });

  afterEach(() => {
    toastSuccess.mockRestore();
    toastError.mockRestore();
  });

  it("shows the security and delete account cards", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Sign in and security" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Delete account" })
    ).toBeInTheDocument();
    expect(screen.getByText("At least 12 characters")).toBeInTheDocument();
    // Destructive action in red
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "ant-btn-dangerous"
    );
    expect(field("Current password")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
    expect(field("New password")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
  });

  describe("change password", () => {
    it("requires every field", async () => {
      renderPage();
      submit();
      expect(
        await screen.findByText("Enter your current password")
      ).toBeInTheDocument();
      expect(screen.getByText("Enter a new password")).toBeInTheDocument();
      expect(screen.getByText("Confirm your new password")).toBeInTheDocument();
      expect(academyService.changePassword).not.toHaveBeenCalled();
    });

    it("needs at least 12 characters, checked on blur", async () => {
      renderPage();
      type("New password", "short");
      // Not while typing
      expect(screen.queryByText("Use at least 12 characters")).toBeNull();

      fireEvent.blur(field("New password"));
      expect(
        await screen.findByText("Use at least 12 characters")
      ).toBeInTheDocument();
    });

    it("rejects reusing the current password", async () => {
      renderPage();
      type("Current password", "same-long-password");
      type("New password", "same-long-password");
      fireEvent.blur(field("New password"));
      expect(
        await screen.findByText(
          "Use a password different from your current one"
        )
      ).toBeInTheDocument();
    });

    it("matches the confirmation as the learner types", async () => {
      renderPage();
      type("New password", "a-much-longer-secret");
      type("Confirm new password", "a-much-longer-secre");
      expect(
        await screen.findByText("Passwords do not match")
      ).toBeInTheDocument();

      type("Confirm new password", "a-much-longer-secret");
      await waitFor(() =>
        expect(screen.queryByText("Passwords do not match")).toBeNull()
      );
    });

    it("re-checks the confirmation when the new password changes", async () => {
      renderPage();
      type("New password", "a-much-longer-secret");
      type("Confirm new password", "a-much-longer-secret");
      type("New password", "another-long-secret");
      expect(
        await screen.findByText("Passwords do not match")
      ).toBeInTheDocument();
    });

    it("saves the new password and clears the form", async () => {
      const save = {};
      academyService.changePassword.mockReturnValue(
        new Promise((resolve) => {
          save.resolve = resolve;
        })
      );
      renderPage();
      fillValidForm();
      submit();

      await waitFor(() =>
        expect(academyService.changePassword).toHaveBeenCalledWith({
          currentPassword: "old-password",
          newPassword: "a-much-longer-secret",
        })
      );
      // antd applies the loading class one effect later
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /Update/ })).toHaveClass(
          "ant-btn-loading"
        )
      );

      save.resolve({ message: "Password changed successfully" });
      await waitFor(() =>
        expect(toastSuccess).toHaveBeenCalledWith(
          "Password changed successfully"
        )
      );
      expect(field("Current password")).toHaveValue("");
      expect(field("New password")).toHaveValue("");
      expect(field("Confirm new password")).toHaveValue("");
    });

    it("shows a wrong current password on that field", async () => {
      academyService.changePassword.mockRejectedValue({
        status: 400,
        message: "Incorrect current password",
      });
      renderPage();
      fillValidForm();
      submit();

      expect(
        await screen.findByText("Incorrect current password")
      ).toBeInTheDocument();
      expect(field("Current password")).toHaveAttribute("aria-invalid", "true");
      expect(toastError).not.toHaveBeenCalled();
      // The typed passwords stay so the learner can fix just that field
      expect(field("New password")).toHaveValue("a-much-longer-secret");
    });

    it("toasts other client errors and leaves server errors global", async () => {
      academyService.changePassword
        .mockRejectedValueOnce({ status: 422, message: "Invalid payload" })
        .mockRejectedValueOnce({ status: 500, message: "Boom" });
      renderPage();
      fillValidForm();

      submit();
      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("Invalid payload")
      );
      submit();
      await waitFor(() =>
        expect(academyService.changePassword).toHaveBeenCalledTimes(2)
      );
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Update" })).not.toHaveClass(
          "ant-btn-loading"
        )
      );
      expect(toastError).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete account", () => {
    const openConfirm = async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete" }));
      return within(await screen.findByRole("dialog"));
    };

    it("asks for confirmation and does nothing on cancel", async () => {
      renderPage();
      const dialog = await openConfirm();
      expect(dialog.getByText("Delete your account?")).toBeInTheDocument();
      expect(dialog.getByText(/can't be undone/)).toBeInTheDocument();
      expect(
        dialog.getByRole("button", { name: "Delete account" })
      ).toHaveClass("ant-btn-dangerous", "ant-btn-primary");

      fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
      await waitFor(() =>
        expect(screen.queryByText("Delete your account?")).toBeNull()
      );
      expect(academyService.deleteAccount).not.toHaveBeenCalled();
    });

    it("closes from the close icon, with focus starting on Cancel", async () => {
      renderPage();
      const dialog = await openConfirm();
      // Focus moves once the open animation ends, which is slow under load
      await waitFor(
        () =>
          expect(dialog.getByRole("button", { name: "Cancel" })).toHaveFocus(),
        { timeout: 3000 }
      );

      fireEvent.click(dialog.getByRole("button", { name: "Close" }));
      await waitFor(() =>
        expect(screen.queryByText("Delete your account?")).toBeNull()
      );
      expect(academyService.deleteAccount).not.toHaveBeenCalled();
    });

    it("cannot be dismissed while the account is being deleted", async () => {
      academyService.deleteAccount.mockReturnValue(new Promise(() => {}));
      renderPage();
      const dialog = await openConfirm();
      fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));

      await waitFor(() =>
        expect(
          dialog.getByRole("button", { name: /Delete account/ })
        ).toHaveClass("ant-btn-loading")
      );
      expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
      expect(dialog.queryByRole("button", { name: "Close" })).toBeNull();
      expect(academyService.deleteAccount).toHaveBeenCalledTimes(1);
    });

    it("deletes, signs out and returns to the Academy landing", async () => {
      renderPage();
      const dialog = await openConfirm();
      fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));

      await waitFor(() =>
        expect(screen.getByTestId("location")).toHaveTextContent(/^\/academy$/)
      );
      expect(academyService.deleteAccount).toHaveBeenCalledTimes(1);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(toastSuccess).toHaveBeenCalledWith(
        "Your account has been deleted."
      );
    });

    it("lists the cases that block deletion", async () => {
      academyService.deleteAccount.mockRejectedValue({
        status: 409,
        message:
          "Cannot delete account: user owns existing cases. Please reassign or delete your cases first.",
        detail: {
          message: "Cannot delete account: user owns existing cases.",
          cases: [
            { value: 1, label: "Cocoa Ghana 2025" },
            { value: 2, label: "Coffee Kenya pilot" },
          ],
        },
      });
      renderPage();
      const dialog = await openConfirm();
      fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));

      expect(
        await screen.findByText("Your account can't be deleted yet")
      ).toBeInTheDocument();
      expect(screen.getByText("Cocoa Ghana 2025")).toBeInTheDocument();
      expect(screen.getByText("Coffee Kenya pilot")).toBeInTheDocument();
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(screen.queryByTestId("location")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "OK" }));
      await waitFor(() =>
        expect(
          screen.queryByText("Your account can't be deleted yet")
        ).toBeNull()
      );
    });

    it("toasts other client errors without signing out", async () => {
      academyService.deleteAccount.mockRejectedValue({
        status: 403,
        message: "Not allowed",
      });
      renderPage();
      const dialog = await openConfirm();
      fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("Not allowed")
      );
      expect(mockSignOut).not.toHaveBeenCalled();
    });
  });
});
