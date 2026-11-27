import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  IdcAccessModalContent,
  showIdcAccessRequestModal,
} from "../idcAccessModal";
import { Modal } from "antd";

jest.mock("antd", () => {
  const actual = jest.requireActual("antd");
  return {
    ...actual,
    Modal: {
      ...actual.Modal,
      info: jest.fn(() => ({
        destroy: jest.fn(),
      })),
    },
  };
});

describe("FE-LOG-09: idcAccessModal Component & Gating Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Modal.info.mockImplementation(() => ({
      destroy: jest.fn(),
    }));
  });

  it("renders modal content with warning badge, title, explanatory body, and buttons", () => {
    const onDiscard = jest.fn();
    const onExplore = jest.fn();
    const onToggle = jest.fn();

    render(
      <IdcAccessModalContent
        onDiscard={onDiscard}
        onExplore={onExplore}
        onToggleDontShowAgain={onToggle}
      />
    );

    expect(
      screen.getByText(
        "You don’t have access to the Income Driver Calculator yet."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your account gives you the Living Income Academy/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-dont-show-again")).toBeInTheDocument();
    expect(screen.getByTestId("button-modal-discard")).toBeInTheDocument();
    expect(screen.getByTestId("button-modal-explore")).toBeInTheDocument();
  });

  it("handles 'Don't show again' checkbox toggle and calls onToggleDontShowAgain", () => {
    const onToggle = jest.fn();
    render(<IdcAccessModalContent onToggleDontShowAgain={onToggle} />);

    const checkbox = screen.getByTestId("checkbox-dont-show-again");
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith(true);
    const dismissedKey = "idh_dismiss_idc_access_warning";
    expect(localStorage.getItem(dismissedKey)).toBe("true");

    // Uncheck
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(false);
    expect(localStorage.getItem(dismissedKey)).toBeNull();
  });

  it("triggers onDiscard and onExplore button callbacks", () => {
    const onDiscard = jest.fn();
    const onExplore = jest.fn();

    render(
      <IdcAccessModalContent onDiscard={onDiscard} onExplore={onExplore} />
    );

    fireEvent.click(screen.getByTestId("button-modal-discard"));
    expect(onDiscard).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("button-modal-explore"));
    expect(onExplore).toHaveBeenCalled();
  });

  it("showIdcAccessRequestModal invokes Modal.info when preference is not dismissed", () => {
    showIdcAccessRequestModal();
    expect(Modal.info).toHaveBeenCalledWith(
      expect.objectContaining({
        className: "access-request-modal",
        width: 654,
      })
    );
  });

  it("showIdcAccessRequestModal suppresses modal when 'Don't show again' is true and force is false", () => {
    localStorage.setItem("idh_dismiss_idc_access_warning", "true");

    const result = showIdcAccessRequestModal({ force: false });
    expect(result).toBeNull();
    expect(Modal.info).not.toHaveBeenCalled();
  });

  it("showIdcAccessRequestModal still opens modal when force is true even if dismissed in localStorage", () => {
    localStorage.setItem("idh_dismiss_idc_access_warning", "true");

    showIdcAccessRequestModal({ force: true });
    expect(Modal.info).toHaveBeenCalled();
  });

  it("renders 'Explore the Academy' label on mobile viewports (<= 600px)", () => {
    window.innerWidth = 375;
    render(<IdcAccessModalContent />);
    expect(screen.getByTestId("button-modal-explore")).toHaveTextContent(
      "Explore the Academy"
    );
    window.innerWidth = 1024;
  });

  it("handles showIdcAccessRequestModal discard + don't show again checkbox persistence", () => {
    const onDiscard = jest.fn();
    const navigate = jest.fn();
    const instance = showIdcAccessRequestModal({ onDiscard, navigate });
    const config = Modal.info.mock.calls[0][0];

    render(config.content);

    fireEvent.click(screen.getByTestId("checkbox-dont-show-again"));
    fireEvent.click(screen.getByTestId("button-modal-discard"));

    expect(localStorage.getItem("idh_dismiss_idc_access_warning")).toBe("true");
    expect(instance.destroy).toHaveBeenCalled();
    expect(onDiscard).toHaveBeenCalled();
  });

  it("handles showIdcAccessRequestModal explore navigation, custom onExplore, and onCancel", () => {
    const navigate = jest.fn();
    const instance = showIdcAccessRequestModal({ navigate });
    const config = Modal.info.mock.calls[0][0];

    const { unmount } = render(config.content);
    fireEvent.click(screen.getByTestId("button-modal-explore"));

    expect(instance.destroy).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/academy/overview");
    unmount();

    jest.clearAllMocks();
    localStorage.clear();
    Modal.info.mockImplementation(() => ({
      destroy: jest.fn(),
    }));
    const onExplore = jest.fn();
    const onDiscard = jest.fn();
    const instance2 = showIdcAccessRequestModal({ onExplore, onDiscard });
    const config2 = Modal.info.mock.calls[0][0];

    render(config2.content);
    fireEvent.click(screen.getByTestId("checkbox-dont-show-again"));
    fireEvent.click(screen.getByTestId("button-modal-explore"));
    expect(instance2.destroy).toHaveBeenCalled();
    expect(onExplore).toHaveBeenCalled();

    config2.onCancel();
    expect(localStorage.getItem("idh_dismiss_idc_access_warning")).toBe("true");
    expect(onDiscard).toHaveBeenCalled();
  });
});
