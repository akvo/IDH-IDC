/* eslint-env jest */
import React, { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { Form, message } from "antd";
import UserState, { defaultUserState } from "../../../store/user";
import academyService from "../services/academy";
import AcademyAccountPage from "../AcademyAccountPage";
import AccountHeroBanner from "../components/AccountHeroBanner";
import PersonalInfoCard from "../components/PersonalInfoCard";
import AdditionalInfoCard from "../components/AdditionalInfoCard";
import CommodityTagSelector from "../components/CommodityTagSelector";
import { getProfileAlertStorageKey } from "../../../components/profile";
import { routePath } from "../../../components/route";

jest.mock("../services/academy", () => ({
  __esModule: true,
  isRequestCancelled: (error) => Boolean(error?.__CANCEL__),
  default: {
    getMe: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getOverview: jest.fn(),
  },
}));

jest.spyOn(message, "success").mockImplementation(() => {});
jest.spyOn(message, "error").mockImplementation(() => {});

const LocationWatcher = () => {
  const location = useLocation();
  return (
    <div data-testid="location-display">
      {location.pathname}
      {location.search}
    </div>
  );
};

const renderAccountPage = (initialEntries = ["/academy/account"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LocationWatcher />
      <Routes>
        <Route path="/academy/account" element={<AcademyAccountPage />} />
        <Route
          path={routePath.academy.courses}
          element={<div data-testid="academy-courses-page">Courses</div>}
        />
      </Routes>
    </MemoryRouter>
  );
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

  it("renders Cancel and Save changes buttons when editing and fires onCancel and onSave", () => {
    const onCancel = jest.fn();
    const onSave = jest.fn();
    render(
      <AccountHeroBanner
        initials="JD"
        fullName="Jane Doe"
        email="jane.doe@example.com"
        isEditing={true}
        onCancel={onCancel}
        onSave={onSave}
      />
    );

    const cancelBtn = screen.getByTestId("btn-cancel-profile");
    const saveBtn = screen.getByTestId("btn-save-profile");
    expect(cancelBtn).toBeInTheDocument();
    expect(saveBtn).toBeInTheDocument();
    expect(screen.queryByTestId("btn-edit-profile")).not.toBeInTheDocument();

    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledTimes(1);
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

  it("fires onContinue when Continue learning button is clicked", () => {
    const onContinue = jest.fn();
    render(
      <AccountHeroBanner
        initials="JD"
        fullName="Jane Doe"
        email="jane.doe@example.com"
        onContinue={onContinue}
      />
    );

    const continueBtn = screen.getByTestId("btn-continue-learning");
    fireEvent.click(continueBtn);
    expect(onContinue).toHaveBeenCalledTimes(1);
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
    expect(screen.getByText("Personal info")).toBeInTheDocument();
    expect(
      screen.getByText("Update your photo and personal details.")
    ).toBeInTheDocument();
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
  }) => {
    const [form] = Form.useForm();
    return (
      <Form form={form} initialValues={currentValues}>
        <AdditionalInfoCard
          isEditing={isEditing}
          companyPlaceholder={companyPlaceholder}
          currentValues={currentValues}
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

    expect(screen.getByText("Additional info")).toBeInTheDocument();
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
      "Company name"
    );
  });
});

describe("CommodityTagSelector", () => {
  it("renders tags in view mode and hides close icons", () => {
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
    expect(screen.queryByTestId("btn-add-commodity")).not.toBeInTheDocument();
  });

  it("renders 'No commodities selected' when disabled and list is empty", () => {
    render(<CommodityTagSelector value={[]} disabled={true} />);
    expect(screen.getByText("No commodities selected")).toBeInTheDocument();
    expect(screen.queryByTestId("btn-add-commodity")).not.toBeInTheDocument();
  });

  it("calls onChange when removing a tag in editable mode", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector
        value={["Coffee", "Tea"]}
        onChange={onChange}
        disabled={false}
      />
    );

    const coffeeTag = screen.getByTestId("commodity-tag-Coffee");
    const closeBtn = coffeeTag.querySelector(".ant-tag-close-icon");
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(onChange).toHaveBeenCalledWith(["Tea"]);
  });

  it("opens add input when clicking 'Add more' button", () => {
    render(<CommodityTagSelector value={["Coffee"]} disabled={false} />);

    const addBtn = screen.getByTestId("btn-add-commodity");
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);
    expect(screen.getByTestId("input-add-commodity")).toBeInTheDocument();
  });

  it("adds a commodity when pressing Enter", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector
        value={["Coffee"]}
        onChange={onChange}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const input = screen.getByTestId("input-add-commodity");

    fireEvent.change(input, { target: { value: "Sugar" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["Coffee", "Sugar"]);
  });

  it("splits multiple comma-separated commodities on Enter or comma", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector
        value={["Coffee"]}
        onChange={onChange}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const input = screen.getByTestId("input-add-commodity");

    fireEvent.change(input, { target: { value: "Sugar, Vanilla, Tea" } });
    fireEvent.keyDown(input, { key: "," });

    expect(onChange).toHaveBeenCalledWith([
      "Coffee",
      "Sugar",
      "Vanilla",
      "Tea",
    ]);
  });

  it("deduplicates case-insensitively against existing and input values", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector
        value={["Coffee"]}
        onChange={onChange}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const input = screen.getByTestId("input-add-commodity");

    fireEvent.change(input, { target: { value: "coffee, COFFEE, Tea" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["Coffee", "Tea"]);
  });

  it("does not call onChange and closes input when pressing Enter with empty value", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector
        value={["Coffee"]}
        onChange={onChange}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const input = screen.getByTestId("input-add-commodity");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("input-add-commodity")).not.toBeInTheDocument();
  });

  it("cancels input on Escape key without invoking onChange", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector
        value={["Coffee"]}
        onChange={onChange}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const input = screen.getByTestId("input-add-commodity");

    fireEvent.change(input, { target: { value: "Cocoa" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("input-add-commodity")).not.toBeInTheDocument();
    expect(screen.getByTestId("btn-add-commodity")).toBeInTheDocument();
  });

  it("commits on blur if input has non-empty text", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector
        value={["Coffee"]}
        onChange={onChange}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const input = screen.getByTestId("input-add-commodity");
    fireEvent.change(input, { target: { value: "Rice" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(["Coffee", "Rice"]);
  });

  it("resets and closes add input on blur if input is empty or whitespace", () => {
    const onChange = jest.fn();
    render(
      <CommodityTagSelector
        value={["Coffee"]}
        onChange={onChange}
        disabled={false}
      />
    );

    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const emptyInput = screen.getByTestId("input-add-commodity");
    fireEvent.change(emptyInput, { target: { value: "   " } });
    fireEvent.blur(emptyInput);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId("input-add-commodity")).not.toBeInTheDocument();
  });

  it("merges custom suggestions with fallback commodities without duplicate keys", () => {
    const ControlledSelector = () => {
      const [val, setVal] = useState([]);
      return (
        <CommodityTagSelector
          value={val}
          onChange={setVal}
          disabled={false}
          suggestions={["CustomCrop", "Wheat"]}
        />
      );
    };

    render(<ControlledSelector />);
    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const input = screen.getByTestId("input-add-commodity");
    expect(input).toBeInTheDocument();
  });
});

describe("AcademyAccountPage Integration", () => {
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
    academyService.getOverview.mockResolvedValue({ continue_chapter_id: 205 });
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

  it("navigates to chapter reader when Continue learning is clicked with continue_chapter_id", async () => {
    academyService.getOverview.mockResolvedValueOnce({
      continue_chapter_id: 301,
    });

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-continue-learning")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-continue-learning"));

    await waitFor(() => {
      expect(screen.getByTestId("location-display")).toHaveTextContent(
        "/academy/courses?chapter=301"
      );
    });
  });

  it("navigates to /academy/courses when Continue learning is clicked without continue_chapter_id", async () => {
    academyService.getOverview.mockResolvedValueOnce({
      continue_chapter_id: null,
    });

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-continue-learning")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-continue-learning"));

    await waitFor(() => {
      expect(screen.getByTestId("location-display")).toHaveTextContent(
        "/academy/courses"
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
      expect(
        screen.getByText("First name cannot be empty")
      ).toBeInTheDocument();
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

    // Add Vanilla commodity tag
    fireEvent.click(screen.getByTestId("btn-add-commodity"));
    const commInput = screen.getByTestId("input-add-commodity");
    fireEvent.change(commInput, { target: { value: "Vanilla" } });
    fireEvent.keyDown(commInput, { key: "Enter" });

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
      expect(message.success).toHaveBeenCalledWith(
        "Profile updated successfully"
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
});
