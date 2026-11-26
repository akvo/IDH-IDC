/* eslint-env jest */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { Form, notification } from "antd";
import UserState, { defaultUserState } from "../../../store/user";
import academyService from "../services/academy";
import MyProfilePage from "../MyProfilePage";
import AccountHeroBanner, { ToolTags } from "../components/AccountHeroBanner";
import PersonalInfoCard from "../components/PersonalInfoCard";
import AdditionalInfoCard from "../components/AdditionalInfoCard";
import CommodityTagSelector from "../components/CommodityTagSelector";
import SettingsLinkCard from "../components/SettingsLinkCard";
import { getProfileAlertStorageKey } from "../../../components/profile";
import { routePath } from "../../../components/route";
import ProfileSavedToast from "../../../components/common/ProfileSavedToast";

jest.mock("../services/academy", () => ({
  __esModule: true,
  isRequestCancelled: (error) => Boolean(error?.__CANCEL__),
  default: {
    getMe: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock("../../../store/static", () => ({
  ...jest.requireActual("../../../store/static"),
  commodityNameOptions: ["Cocoa", "Coffee", "Rice", "Vanilla"].map((name) => ({
    label: name,
    value: name,
  })),
}));

jest.spyOn(notification, "open").mockImplementation(() => {});

jest.setTimeout(30000);

const LocationWatcher = () => {
  const location = useLocation();
  return (
    <div data-testid="location-display">
      {location.pathname}
      {location.search}
    </div>
  );
};

const renderAccountPage = (initialEntries = [routePath.academy.profile]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LocationWatcher />
      <Routes>
        <Route path={routePath.academy.profile} element={<MyProfilePage />} />
        <Route path={routePath.profile} element={<MyProfilePage />} />
        <Route
          path={routePath.academy.settings}
          element={<div data-testid="academy-settings-page">Settings</div>}
        />
        <Route
          path={routePath.settings}
          element={<div data-testid="idc-settings-page">Settings</div>}
        />
      </Routes>
    </MemoryRouter>
  );
};

const openSelect = (testId) => {
  const select = screen.getByTestId(testId);
  fireEvent.mouseDown(select.querySelector(".ant-select-selector") || select);
};

describe("AccountHeroBanner", () => {
  it("renders banner avatar, full name, and email", () => {
    render(
      <AccountHeroBanner
        initials="JD"
        fullName="Jane Doe"
        email="jane.doe@example.com"
      />
    );

    expect(screen.getByTestId("account-hero-avatar")).toHaveTextContent("JD");
    expect(screen.getByTestId("account-hero-name")).toHaveTextContent(
      "Jane Doe"
    );
    expect(screen.getByTestId("account-hero-email")).toHaveTextContent(
      "jane.doe@example.com"
    );
  });

  it("renders Edit profile button when not editing and fires onEdit", () => {
    const onEdit = jest.fn();
    render(
      <AccountHeroBanner
        initials="JD"
        fullName="Jane Doe"
        email="jane.doe@example.com"
        isEditing={false}
        onEdit={onEdit}
      />
    );

    const editBtn = screen.getByTestId("btn-edit-profile");
    expect(editBtn).toBeInTheDocument();
    expect(screen.queryByTestId("btn-cancel-profile")).not.toBeInTheDocument();
    expect(screen.queryByTestId("btn-save-profile")).not.toBeInTheDocument();

    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("renders Cancel and Save buttons when editing and fires onCancel", () => {
    const onCancel = jest.fn();
    render(
      <AccountHeroBanner
        initials="JD"
        fullName="Jane Doe"
        email="jane.doe@example.com"
        isEditing={true}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByTestId("btn-cancel-profile");
    const saveBtn = screen.getByTestId("btn-save-profile");
    expect(saveBtn).toHaveTextContent("Save");
    expect(saveBtn).toHaveAttribute("type", "submit");
    expect(screen.queryByTestId("btn-edit-profile")).not.toBeInTheDocument();

    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables Cancel and displays loading state on Save when saving is true", () => {
    render(
      <AccountHeroBanner
        initials="JD"
        fullName="Jane Doe"
        email="jane.doe@example.com"
        isEditing={true}
        saving={true}
      />
    );

    expect(screen.getByTestId("btn-cancel-profile")).toBeDisabled();
    expect(screen.getByTestId("btn-save-profile")).toHaveClass(
      "ant-btn-loading"
    );
  });

  it("has no Continue learning button", () => {
    render(<AccountHeroBanner initials="JD" fullName="Jane Doe" email="" />);
    expect(screen.queryByText("Continue learning")).not.toBeInTheDocument();
  });
});

describe("ToolTags", () => {
  it.each([
    [["academy"], ["LI Academy"]],
    [["idc"], ["IDC"]],
    [
      ["idc", "academy"],
      ["LI Academy", "IDC"],
    ],
  ])("shows the badges for tools %j", (tools, labels) => {
    render(<ToolTags tools={tools} />);
    expect(
      screen.getAllByTestId(/^tool-tag-/).map((tag) => tag.textContent)
    ).toEqual(labels);
  });

  it("renders nothing without tools", () => {
    const { container } = render(<ToolTags tools={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("PersonalInfoCard", () => {
  const FormWrapper = ({ isEditing, initialValues = {} }) => {
    const [form] = Form.useForm();
    return (
      <Form form={form} initialValues={initialValues}>
        <PersonalInfoCard isEditing={isEditing} />
      </Form>
    );
  };

  it("renders card title and subtitle", () => {
    render(<FormWrapper isEditing={false} />);
    expect(screen.getByText("Personal information")).toBeInTheDocument();
    expect(screen.getByText("Update personal details.")).toBeInTheDocument();
    expect(screen.getByTestId("input-first-name")).toHaveAttribute(
      "placeholder",
      "Fill in your First name"
    );
    expect(screen.getByTestId("input-last-name")).toHaveAttribute(
      "placeholder",
      "Fill in your Last name"
    );
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("disables first_name, last_name, and email when isEditing is false", () => {
    render(
      <FormWrapper
        isEditing={false}
        initialValues={{
          first_name: "Jane",
          last_name: "Doe",
          email: "jane.doe@example.com",
        }}
      />
    );

    expect(screen.getByTestId("input-first-name")).toBeDisabled();
    expect(screen.getByTestId("input-last-name")).toBeDisabled();
    expect(screen.getByTestId("input-email")).toBeDisabled();
    expect(
      screen.getByText("Email address cannot be changed.")
    ).toBeInTheDocument();
  });

  it("enables first_name and last_name while keeping email disabled when isEditing is true", () => {
    render(
      <FormWrapper
        isEditing={true}
        initialValues={{
          first_name: "Jane",
          last_name: "Doe",
          email: "jane.doe@example.com",
        }}
      />
    );

    expect(screen.getByTestId("input-first-name")).not.toBeDisabled();
    expect(screen.getByTestId("input-last-name")).not.toBeDisabled();
    expect(screen.getByTestId("input-email")).toBeDisabled();
  });

  it("renders with default props", () => {
    render(<FormWrapper />);
    expect(screen.getByTestId("input-first-name")).toBeDisabled();
  });
});

describe("AdditionalInfoCard", () => {
  const FormWrapper = ({
    isEditing = false,
    companyPlaceholder = "Acme Corp",
    currentValues = {},
    ...props
  }) => {
    const [form] = Form.useForm();
    return (
      <Form form={form} initialValues={currentValues}>
        <AdditionalInfoCard
          isEditing={isEditing}
          companyPlaceholder={companyPlaceholder}
          currentValues={currentValues}
          {...props}
        />
      </Form>
    );
  };

  it("renders card title and fields with custom placeholder and disabled state", () => {
    render(
      <FormWrapper
        isEditing={false}
        companyPlaceholder="Custom Placeholder"
        currentValues={{
          company_name: "Acme",
          company_type: "NGO",
          sector: "Agriculture",
          region_name: "Global",
          commodities: ["Coffee"],
        }}
      />
    );

    expect(screen.getByText("Additional information")).toBeInTheDocument();
    expect(
      screen.getByText("Update your personal details.")
    ).toBeInTheDocument();
    const companyInput = screen.getByTestId("input-company-name");
    expect(companyInput).toBeDisabled();
    expect(companyInput).toHaveAttribute("placeholder", "Custom Placeholder");
    expect(screen.getByTestId("select-company-type")).toHaveClass(
      "ant-select-disabled"
    );
    expect(screen.getByTestId("select-sector")).toHaveClass(
      "ant-select-disabled"
    );
    expect(screen.getByTestId("select-region")).toHaveClass(
      "ant-select-disabled"
    );
  });

  it("enables fields when isEditing is true and supports custom fallback options", () => {
    render(
      <FormWrapper
        isEditing={true}
        companyPlaceholder="Acme Corp"
        currentValues={{
          company_type: "Custom Company Type",
          sector: "Space Exploration",
          region_name: "Mars Colony",
        }}
      />
    );

    expect(screen.getByTestId("input-company-name")).not.toBeDisabled();
    expect(screen.getByTestId("select-company-type")).not.toHaveClass(
      "ant-select-disabled"
    );
    expect(screen.getByTestId("select-sector")).not.toHaveClass(
      "ant-select-disabled"
    );
    expect(screen.getByTestId("select-region")).not.toHaveClass(
      "ant-select-disabled"
    );

    // Verify fallback options are present in the DOM for custom values
    expect(screen.getByText("Custom Company Type")).toBeInTheDocument();
    expect(screen.getByText("Space Exploration")).toBeInTheDocument();
    expect(screen.getByText("Mars Colony")).toBeInTheDocument();
  });

  it("renders with default props", () => {
    const Wrapper = () => {
      const [form] = Form.useForm();
      return (
        <Form form={form}>
          <AdditionalInfoCard />
        </Form>
      );
    };
    render(<Wrapper />);
    expect(screen.getByTestId("input-company-name")).toBeDisabled();
    expect(screen.getByTestId("input-company-name")).toHaveAttribute(
      "placeholder",
      "Fill in your company or organisation"
    );
    expect(screen.queryByTestId("input-idh-company")).not.toBeInTheDocument();
  });

  it("shows the role read-only, even while editing", () => {
    render(<FormWrapper isEditing role="super_admin" />);
    expect(screen.getByTestId("input-role")).toHaveValue("Super Admin");
    expect(screen.getByTestId("input-role")).toBeDisabled();
  });

  it("shows the IDH company read-only when one is given", () => {
    render(<FormWrapper isEditing idhCompanyName="Olam" />);
    expect(screen.getByTestId("input-idh-company")).toHaveValue("Olam");
    expect(screen.getByTestId("input-idh-company")).toBeDisabled();
  });
});

describe("CommodityTagSelector", () => {
  it("renders tags in view mode without close icons", () => {
    const { container } = render(
      <CommodityTagSelector value={["Coffee", "Cocoa"]} disabled={true} />
    );

    expect(screen.getByTestId("commodity-tag-Coffee")).toHaveTextContent(
      "Coffee"
    );
    expect(screen.getByTestId("commodity-tag-Cocoa")).toHaveTextContent(
      "Cocoa"
    );
    expect(container.querySelectorAll(".ant-tag-close-icon")).toHaveLength(0);
  });

  it("removes a commodity with the tag's close icon", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector value={["Coffee", "Rice"]} onChange={onChange} />
    );

    fireEvent.click(
      screen
        .getByTestId("commodity-tag-Coffee")
        .querySelector(".ant-tag-close-icon")
    );
    expect(onChange).toHaveBeenCalledWith(["Rice"], expect.anything());
  });

  it("lists the commodities with a checkbox each, checked when selected", () => {
    render(<CommodityTagSelector value={["Cocoa"]} onChange={jest.fn()} />);
    openSelect("commodity-tag-selector");

    const checkboxes = document.querySelectorAll(
      ".commodity-tag-selector-dropdown .ant-checkbox-input"
    );
    expect(checkboxes).toHaveLength(4);
    const cocoa = screen.getByText("Cocoa", {
      selector: ".commodity-tag-selector-dropdown .ant-checkbox + span",
    });
    expect(cocoa.parentElement.querySelector("input")).toBeChecked();
  });

  it("adds a commodity when its option is clicked", () => {
    const onChange = jest.fn();
    render(<CommodityTagSelector value={["Cocoa"]} onChange={onChange} />);
    openSelect("commodity-tag-selector");

    fireEvent.click(
      screen.getByText("Rice", {
        selector: ".commodity-tag-selector-dropdown .ant-checkbox + span",
      })
    );
    expect(onChange).toHaveBeenCalledWith(["Cocoa", "Rice"], expect.anything());
  });

  it("keeps a saved commodity that is not in the list", () => {
    render(<CommodityTagSelector value={["Saffron"]} onChange={jest.fn()} />);
    expect(screen.getByTestId("commodity-tag-Saffron")).toBeInTheDocument();
    openSelect("commodity-tag-selector");
    expect(
      screen.getByText("Saffron", {
        selector: ".commodity-tag-selector-dropdown .ant-checkbox + span",
      })
    ).toBeInTheDocument();
  });
});

describe("MyProfilePage Integration", () => {
  const mockProfile = {
    first_name: "Jane",
    last_name: "Doe",
    company_name: "Acme Fairtrade",
    company_type: "Private Sector",
    sector: "Agriculture",
    region_name: "West Africa",
    region_id: 12,
    commodities: ["Cocoa", "Coffee"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      UserState.update(() => ({
        ...defaultUserState,
        id: 77,
        fullname: "Jane Doe",
        email: "jane.doe@example.com",
        company_name: "Acme Fairtrade",
      }));
    });

    academyService.getProfile.mockResolvedValue({ ...mockProfile });
    academyService.getMe.mockResolvedValue({
      id: 77,
      fullname: "Jane Doe",
      email: "jane.doe@example.com",
      company_name: "Acme Fairtrade",
      user_profile: {
        first_name: "Jane",
        last_name: "Doe",
        company_name: "Acme Fairtrade",
      },
    });
  });

  it("renders loading skeleton while fetching profile", async () => {
    let resolveProfile;
    academyService.getProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve;
        })
    );

    renderAccountPage();
    expect(screen.getByTestId("account-loading")).toBeInTheDocument();

    await act(async () => {
      resolveProfile(mockProfile);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("account-loading")).not.toBeInTheDocument();
      expect(screen.getByTestId("academy-account-form")).toBeInTheDocument();
    });
  });

  it("renders error state on profile load failure and recovers on retry", async () => {
    academyService.getProfile.mockRejectedValueOnce(
      new Error("Network connection error")
    );

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByText("Failed to load profile")).toBeInTheDocument();
      expect(screen.getByText("Network connection error")).toBeInTheDocument();
      expect(screen.getByTestId("account-error-retry")).toBeInTheDocument();
    });

    academyService.getProfile.mockResolvedValueOnce({ ...mockProfile });

    fireEvent.click(screen.getByTestId("account-error-retry"));

    await waitFor(() => {
      expect(
        screen.queryByText("Failed to load profile")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("academy-account-form")).toBeInTheDocument();
    });
  });

  it("silently ignores canceled requests without showing error state", async () => {
    const canceledError = new Error("Request aborted");
    canceledError.__CANCEL__ = true;
    academyService.getProfile.mockRejectedValueOnce(canceledError);

    renderAccountPage();

    await waitFor(() => {
      expect(
        screen.queryByText("Failed to load profile")
      ).not.toBeInTheDocument();
    });
  });

  it("hydrates email and UserState via getMe if email is missing from store", async () => {
    act(() => {
      UserState.update((s) => {
        s.email = null;
        s.fullname = null;
      });
    });

    academyService.getMe.mockResolvedValueOnce({
      id: 88,
      fullname: "Hydrated User",
      email: "hydrated@example.com",
      company_name: "Hydrated Org",
    });

    renderAccountPage();

    await waitFor(() => {
      expect(academyService.getMe).toHaveBeenCalled();
      expect(screen.getByTestId("account-hero-email")).toHaveTextContent(
        "hydrated@example.com"
      );
    });
  });

  it("renders profile data in View mode with disabled inputs and correct initials", async () => {
    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("account-hero-name")).toHaveTextContent(
        "Jane Doe"
      );
      expect(screen.getByTestId("account-hero-avatar")).toHaveTextContent("JD");
      expect(screen.getByTestId("account-hero-email")).toHaveTextContent(
        "jane.doe@example.com"
      );
    });

    expect(screen.getByTestId("input-first-name")).toHaveValue("Jane");
    expect(screen.getByTestId("input-first-name")).toBeDisabled();

    expect(screen.getByTestId("input-last-name")).toHaveValue("Doe");
    expect(screen.getByTestId("input-last-name")).toBeDisabled();

    expect(screen.getByTestId("input-email")).toHaveValue(
      "jane.doe@example.com"
    );
    expect(screen.getByTestId("input-email")).toBeDisabled();

    expect(screen.getByTestId("input-company-name")).toHaveValue(
      "Acme Fairtrade"
    );
    expect(screen.getByTestId("input-company-name")).toBeDisabled();

    expect(screen.getByTestId("commodity-tag-Cocoa")).toBeInTheDocument();
    expect(screen.getByTestId("commodity-tag-Coffee")).toBeInTheDocument();
  });

  it("falls back to email initials when profile name is empty", async () => {
    academyService.getProfile.mockResolvedValueOnce({
      ...mockProfile,
      first_name: "",
      last_name: "",
    });
    act(() => {
      UserState.update((s) => {
        s.fullname = "";
        s.email = "samuel@example.com";
      });
    });

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("account-hero-avatar")).toHaveTextContent("SA");
    });
  });

  it("falls back to 'U' when name and email are both absent", async () => {
    academyService.getProfile.mockResolvedValueOnce({
      ...mockProfile,
      first_name: "",
      last_name: "",
    });
    academyService.getMe.mockResolvedValueOnce({
      id: 77,
      fullname: "",
      email: "",
      user_profile: null,
    });
    act(() => {
      UserState.update((s) => {
        s.fullname = "";
        s.email = "";
      });
    });

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("account-hero-avatar")).toHaveTextContent("U");
    });
  });

  it("computes companyPlaceholder from userState fallback when profile has no company", async () => {
    academyService.getProfile.mockResolvedValueOnce({
      ...mockProfile,
      company_name: null,
    });
    act(() => {
      UserState.update((s) => {
        s.company_name = "State Corp";
      });
    });

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("input-company-name")).toHaveAttribute(
        "placeholder",
        "State Corp"
      );
    });
  });

  it("toggles edit mode and updates banner name and initials live as user types", async () => {
    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-edit-profile"));

    expect(screen.getByTestId("btn-save-profile")).toBeInTheDocument();
    expect(screen.getByTestId("btn-cancel-profile")).toBeInTheDocument();

    const firstNameInput = screen.getByTestId("input-first-name");
    const lastNameInput = screen.getByTestId("input-last-name");

    expect(firstNameInput).not.toBeDisabled();
    expect(lastNameInput).not.toBeDisabled();

    fireEvent.change(firstNameInput, { target: { value: "Alice" } });
    fireEvent.change(lastNameInput, { target: { value: "Wonderland" } });

    await waitFor(() => {
      expect(screen.getByTestId("account-hero-name")).toHaveTextContent(
        "Alice Wonderland"
      );
      expect(screen.getByTestId("account-hero-avatar")).toHaveTextContent("AW");
    });
  });

  it("enforces validation on first_name: rejects empty or whitespace-only values", async () => {
    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-edit-profile"));

    const firstNameInput = screen.getByTestId("input-first-name");
    fireEvent.change(firstNameInput, { target: { value: "   " } });

    fireEvent.click(screen.getByTestId("btn-save-profile"));

    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
    });
    expect(academyService.updateProfile).not.toHaveBeenCalled();
  });

  it("rolls back form and live banner edits on Cancel", async () => {
    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-edit-profile"));

    const firstNameInput = screen.getByTestId("input-first-name");
    fireEvent.change(firstNameInput, { target: { value: "ModifiedName" } });

    await waitFor(() => {
      expect(screen.getByTestId("account-hero-name")).toHaveTextContent(
        "ModifiedName Doe"
      );
    });

    fireEvent.click(screen.getByTestId("btn-cancel-profile"));

    await waitFor(() => {
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
      expect(screen.getByTestId("input-first-name")).toHaveValue("Jane");
      expect(screen.getByTestId("account-hero-name")).toHaveTextContent(
        "Jane Doe"
      );
    });
  });

  it("saves changes, sets region_id: null when region name changes, and syncs UserState", async () => {
    const updatedProfileResponse = {
      ...mockProfile,
      first_name: "Janet",
      last_name: "Smith",
      company_name: "New Enterprise",
      region_name: "East Africa",
      region_id: null,
      commodities: ["Coffee", "Vanilla"],
    };

    academyService.updateProfile.mockResolvedValueOnce(updatedProfileResponse);
    academyService.getMe.mockResolvedValueOnce({
      id: 77,
      fullname: "Janet Smith",
      email: "jane.doe@example.com",
      company_name: "New Enterprise",
      user_profile: {
        first_name: "Janet",
        last_name: "Smith",
        company_name: "New Enterprise",
        sector: "Agriculture",
        region_name: "West Africa",
        commodities: ["Cocoa"],
      },
    });

    const storageKey = getProfileAlertStorageKey(77);
    window.localStorage.setItem(storageKey, "true");

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-edit-profile"));

    fireEvent.change(screen.getByTestId("input-first-name"), {
      target: { value: "  Janet  " },
    });
    fireEvent.change(screen.getByTestId("input-last-name"), {
      target: { value: "  Smith  " },
    });
    fireEvent.change(screen.getByTestId("input-company-name"), {
      target: { value: "  New Enterprise  " },
    });

    // Remove Cocoa commodity tag
    const cocoaTag = screen.getByTestId("commodity-tag-Cocoa");
    fireEvent.click(cocoaTag.querySelector(".ant-tag-close-icon"));

    // Add Vanilla from the commodity list
    openSelect("commodity-tag-selector");
    fireEvent.click(
      screen.getByText("Vanilla", {
        selector: ".commodity-tag-selector-dropdown .ant-checkbox + span",
      })
    );

    // Change region
    const regionSelect = screen.getByTestId("select-region");
    const selector =
      regionSelect.querySelector(".ant-select-selector") || regionSelect;
    fireEvent.mouseDown(selector);

    const option = await waitFor(() =>
      screen.getByText("East Africa", {
        selector: ".ant-select-item-option-content",
      })
    );
    act(() => {
      fireEvent.click(option);
    });

    fireEvent.click(screen.getByTestId("btn-save-profile"));

    await waitFor(() => {
      expect(academyService.updateProfile).toHaveBeenCalledWith({
        first_name: "Janet",
        last_name: "Smith",
        company_name: "New Enterprise",
        company_type: "Private Sector",
        sector: "Agriculture",
        region_name: "East Africa",
        region_id: null,
        commodities: ["Coffee", "Vanilla"],
      });
      expect(notification.open).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 4, placement: "top" })
      );
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    });

    expect(window.localStorage.getItem(storageKey)).toBeNull();
  });

  it("preserves region_id when region name is unchanged", async () => {
    academyService.updateProfile.mockResolvedValueOnce({
      ...mockProfile,
      first_name: "Jane",
    });

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-edit-profile"));
    fireEvent.click(screen.getByTestId("btn-save-profile"));

    await waitFor(() => {
      expect(academyService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          region_name: "West Africa",
          region_id: 12,
        })
      );
    });
  });

  it("handles save failure by showing saveError alert without clearing form edits", async () => {
    academyService.updateProfile.mockRejectedValueOnce({
      response: {
        data: {
          detail: "Company name is invalid",
        },
      },
    });

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-edit-profile"));

    const firstNameInput = screen.getByTestId("input-first-name");
    fireEvent.change(firstNameInput, { target: { value: "KeepThisEdit" } });

    fireEvent.click(screen.getByTestId("btn-save-profile"));

    await waitFor(() => {
      expect(screen.getByTestId("account-save-error")).toHaveTextContent(
        "Company name is invalid"
      );
    });

    // Form inputs and edit mode are preserved
    expect(screen.getByTestId("input-first-name")).toHaveValue("KeepThisEdit");
    expect(screen.getByTestId("btn-save-profile")).toBeInTheDocument();

    // Closing the alert dismisses it
    const closeBtn = screen
      .getByTestId("account-save-error")
      .querySelector(".ant-alert-close-icon");
    if (closeBtn) {
      fireEvent.click(closeBtn);
      await waitFor(() => {
        expect(
          screen.queryByTestId("account-save-error")
        ).not.toBeInTheDocument();
      });
    }
  });

  it("formats non-string error messages gracefully on save failure", async () => {
    academyService.updateProfile.mockRejectedValueOnce({
      response: {
        data: {
          detail: { field: "server validation error" },
        },
      },
    });

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-edit-profile"));
    fireEvent.click(screen.getByTestId("btn-save-profile"));

    await waitFor(() => {
      expect(screen.getByTestId("account-save-error")).toBeInTheDocument();
    });
  });

  it("shows the tool badges, role and IDH company for an IDC user", async () => {
    act(() => {
      UserState.update((s) => {
        s.role = "admin";
        s.tools = ["academy", "idc"];
        s.company = 5;
        s.company_name = "Olam";
      });
    });
    renderAccountPage([routePath.profile]);

    await screen.findByTestId("academy-account-form");
    expect(screen.getByTestId("tool-tag-academy")).toHaveTextContent(
      "LI Academy"
    );
    expect(screen.getByTestId("tool-tag-idc")).toHaveTextContent("IDC");
    expect(screen.getByTestId("input-role")).toHaveValue("Admin");
    expect(screen.getByTestId("input-idh-company")).toHaveValue("Olam");
  });

  it("hides the IDH company for an Academy-only user", async () => {
    act(() => {
      UserState.update((s) => {
        s.tools = ["academy"];
      });
    });
    renderAccountPage();

    await screen.findByTestId("academy-account-form");
    expect(screen.getByTestId("tool-tag-academy")).toBeInTheDocument();
    expect(screen.queryByTestId("tool-tag-idc")).not.toBeInTheDocument();
    expect(screen.queryByTestId("input-idh-company")).not.toBeInTheDocument();
  });

  it.each([
    [routePath.academy.profile, "academy-settings-page"],
    [routePath.profile, "idc-settings-page"],
  ])(
    "links To settings from %s to that tool's settings",
    async (path, page) => {
      renderAccountPage([path]);

      fireEvent.click(await screen.findByTestId("btn-to-settings"));
      expect(screen.getByTestId(page)).toBeInTheDocument();
    }
  );

  it("asks to complete missing details and highlights them on load", async () => {
    academyService.getProfile.mockResolvedValueOnce({
      ...mockProfile,
      sector: null,
      commodities: [],
    });
    renderAccountPage();

    expect(
      await screen.findByTestId("profile-incomplete-alert")
    ).toHaveTextContent("Please complete the highlighted details");

    // Highlighted before "Edit profile" is clicked
    expect(screen.getByTestId("btn-edit-profile")).toBeInTheDocument();
    expect(await screen.findByText("Sector is required")).toBeInTheDocument();
    expect(
      screen.getByText("Select at least one commodity")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("First name is required")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("btn-edit-profile"));

    expect(await screen.findByText("Sector is required")).toBeInTheDocument();
  });

  it("does not ask for details that are complete", async () => {
    renderAccountPage();

    await screen.findByTestId("academy-account-form");
    expect(
      screen.queryByTestId("profile-incomplete-alert")
    ).not.toBeInTheDocument();
  });

  it("opens in edit mode from the Complete now reminder and clears the flag", async () => {
    renderAccountPage([`${routePath.academy.profile}?edit=1`]);

    expect(await screen.findByTestId("btn-save-profile")).toBeInTheDocument();
    expect(screen.getByTestId("input-first-name")).not.toBeDisabled();
    await waitFor(() =>
      expect(screen.getByTestId("location-display")).toHaveTextContent(
        /^\/academy\/profile$/
      )
    );
  });
});

describe("SettingsLinkCard", () => {
  it("shows the settings copy", () => {
    render(
      <MemoryRouter>
        <SettingsLinkCard settingsPath="/settings" />
      </MemoryRouter>
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(
      screen.getByText("Change password or delete account")
    ).toBeInTheDocument();
    expect(screen.getByTestId("btn-to-settings")).toHaveTextContent(
      "To settings"
    );
  });
});

describe("ProfileSavedToast", () => {
  it("shows the saved confirmation", () => {
    render(<ProfileSavedToast />);
    expect(screen.getByTestId("profile-saved-toast")).toHaveTextContent(
      "Changes saved Your profile is updated!"
    );
  });
});
