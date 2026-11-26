import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Form, Button, Skeleton, Result, Alert } from "antd";
import UserState, { syncUserState } from "../../store/user";
import academyService, {
  academyClient,
  isRequestCancelled,
} from "./services/academy";
import { getUserInitials } from "./utils";
import { routePath } from "../../components/route";
import {
  getProfileAlertStorageKey,
  isUserProfileIncomplete,
} from "../../components/profile";
import AccountHeroBanner from "./components/AccountHeroBanner";
import PersonalInfoCard from "./components/PersonalInfoCard";
import AdditionalInfoCard from "./components/AdditionalInfoCard";
import SettingsLinkCard from "./components/SettingsLinkCard";
import { showProfileSavedToast } from "../../components/common/ProfileSavedToast";
import "./MyProfilePage.scss";

// Fields a complete profile needs, in page order
export const MANDATORY_PROFILE_FIELDS = [
  "first_name",
  "company_name",
  "sector",
  "region_name",
  "commodities",
];

// Query flag set by the "Complete now" reminder to open in edit mode
export const EDIT_PROFILE_PARAM = "edit";

const isBlank = (value) =>
  Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim();

// Shared "My profile" page (TLSA-014). Rendered inside the Academy shell at
// /academy/profile and inside the plain account shell at /profile.
const MyProfilePage = () => {
  const [form] = Form.useForm();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const userState = UserState.useState((s) => s);
  const isAcademyContext = pathname.startsWith(routePath.academy.landing);
  const tools = useMemo(
    () => (Array.isArray(userState?.tools) ? userState.tools : []),
    [userState?.tools]
  );
  // The IDH company only exists for IDC users; it is managed by IDH
  const idhCompanyName =
    tools.includes("idc") && userState?.company
      ? userState?.company_name || ""
      : "";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const initialRegionNameRef = useRef(null);

  const fetchProfileData = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const data =
          typeof academyService?.getProfile === "function"
            ? await academyService.getProfile({ signal })
            : await academyClient
                .get("academy/profile", { signal })
                .then((res) => res.data);
        setProfile(data);
        initialRegionNameRef.current = data?.region_name || null;
        form.setFieldsValue({
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          email: userState?.email || "",
          company_name: data?.company_name || "",
          company_type: data?.company_type || null,
          sector: data?.sector || null,
          region_name: data?.region_name || null,
          commodities: Array.isArray(data?.commodities) ? data.commodities : [],
        });
        setLoading(false);
      } catch (err) {
        if (
          isRequestCancelled(err) ||
          err?.name === "CanceledError" ||
          err?.name === "AbortError" ||
          signal?.aborted
        ) {
          return;
        }
        setError(err?.message || "Failed to load profile");
        setLoading(false);
      }
    },
    [form, userState?.email]
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // Hydrate email if missing from user state
    if (!userState?.email && typeof academyService?.getMe === "function") {
      academyService
        .getMe({ signal })
        .then((me) => {
          if (me) {
            syncUserState(me);
          }
        })
        .catch(() => {});
    }

    fetchProfileData(signal);

    return () => {
      controller.abort();
    };
  }, [fetchProfileData, userState?.email]);

  // Keep form email field synchronized with userState email
  useEffect(() => {
    if (userState?.email) {
      form.setFieldsValue({ email: userState.email });
    }
  }, [form, userState?.email]);

  const formValues = Form.useWatch([], form) || {};

  const displayFirstName = isEditing
    ? formValues.first_name ?? profile?.first_name
    : profile?.first_name;
  const displayLastName = isEditing
    ? formValues.last_name ?? profile?.last_name
    : profile?.last_name;

  const displayFullName = useMemo(() => {
    const combined = [displayFirstName, displayLastName]
      .map((n) => (typeof n === "string" ? n.trim() : ""))
      .filter(Boolean)
      .join(" ");
    return combined || userState?.fullname || "";
  }, [displayFirstName, displayLastName, userState?.fullname]);

  const initials = useMemo(() => {
    const computed = getUserInitials({
      fullname: displayFullName,
      user_profile: {
        first_name: displayFirstName,
        last_name: displayLastName,
      },
    });
    if (computed) {
      return computed;
    }
    const email = userState?.email;
    return email ? email.slice(0, 2).toUpperCase() : "U";
  }, [displayFullName, displayFirstName, displayLastName, userState?.email]);

  const companyPlaceholder = useMemo(() => {
    return (
      profile?.company_name ||
      userState?.company_name ||
      userState?.user_profile?.company_name ||
      "Fill in your company or organisation"
    );
  }, [
    profile?.company_name,
    userState?.company_name,
    userState?.user_profile?.company_name,
  ]);

  const handleSave = async () => {
    try {
      setSaveError(null);
      const values = await form.validateFields();
      setSaving(true);

      const trimmedFirstName = values.first_name
        ? values.first_name.trim()
        : null;
      const trimmedLastName = values.last_name ? values.last_name.trim() : null;
      const trimmedCompanyName = values.company_name
        ? values.company_name.trim()
        : null;
      const trimmedCompanyType = values.company_type
        ? values.company_type.trim()
        : null;
      const trimmedSector = values.sector ? values.sector.trim() : null;
      const trimmedRegionName = values.region_name
        ? values.region_name.trim()
        : null;

      // Reset region_id to null when region_name changes from initial/current profile
      const regionId =
        trimmedRegionName !== (profile?.region_name ?? null)
          ? null
          : profile?.region_id ?? null;

      const commoditiesArray = Array.isArray(values.commodities)
        ? values.commodities
        : [];

      const payload = {
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        company_name: trimmedCompanyName,
        company_type: trimmedCompanyType,
        sector: trimmedSector,
        region_name: trimmedRegionName,
        region_id: regionId,
        commodities: commoditiesArray,
      };

      const updated =
        typeof academyService?.updateProfile === "function"
          ? await academyService.updateProfile(payload)
          : await academyClient
              .put("academy/profile", payload)
              .then((res) => res.data);
      setProfile(updated);
      initialRegionNameRef.current = updated?.region_name || null;

      form.setFieldsValue({
        first_name: updated?.first_name || "",
        last_name: updated?.last_name || "",
        email: userState?.email || "",
        company_name: updated?.company_name || "",
        company_type: updated?.company_type || null,
        sector: updated?.sector || null,
        region_name: updated?.region_name || null,
        commodities: Array.isArray(updated?.commodities)
          ? updated.commodities
          : [],
      });

      // Synchronize global UserState reactively via getMe()
      try {
        if (typeof academyService?.getMe === "function") {
          const me = await academyService.getMe();
          if (me) {
            syncUserState(me);
            if (userState?.id && !isUserProfileIncomplete(me)) {
              try {
                window.localStorage?.removeItem(
                  getProfileAlertStorageKey(userState.id)
                );
              } catch (e) {
                // ignore storage error
              }
            }
          }
        }
      } catch (meErr) {
        // Non-blocking sync error
      }

      setIsEditing(false);
      showProfileSavedToast();
    } catch (err) {
      if (err?.errorFields) {
        // Form field validation failure
        return;
      }
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to update profile";
      setSaveError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.setFieldsValue({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      email: userState?.email || "",
      company_name: profile?.company_name || "",
      company_type: profile?.company_type || null,
      sector: profile?.sector || null,
      region_name: profile?.region_name || null,
      commodities: Array.isArray(profile?.commodities)
        ? profile.commodities
        : [],
    });
    setSaveError(null);
    setIsEditing(false);
  };

  const missingFields = useMemo(
    () =>
      profile
        ? MANDATORY_PROFILE_FIELDS.filter((field) => isBlank(profile[field]))
        : [],
    [profile]
  );
  // An IDC company stands in for the self-reported one
  const requiredMissing = useMemo(
    () =>
      idhCompanyName
        ? missingFields.filter((field) => field !== "company_name")
        : missingFields,
    [idhCompanyName, missingFields]
  );

  // Highlight missing details as soon as the profile loads, not only after
  // "Edit profile", so the "highlighted details" alert points at something
  useEffect(() => {
    if (!loading && requiredMissing.length) {
      form.validateFields(requiredMissing).catch(() => {});
    }
  }, [form, loading, requiredMissing]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (!requiredMissing.length) {
      return;
    }
    // Highlight what is missing once the inputs are enabled
    setTimeout(() => {
      form.validateFields(requiredMissing).catch(() => {});
      form.getFieldInstance(requiredMissing[0])?.focus?.();
    });
  }, [form, requiredMissing]);

  // "Complete now" from the profile reminder opens the form ready to edit
  const openInEditMode = searchParams.has(EDIT_PROFILE_PARAM);
  useEffect(() => {
    if (openInEditMode && profile) {
      startEditing();
      setSearchParams(
        (params) => {
          params.delete(EDIT_PROFILE_PARAM);
          return params;
        },
        { replace: true }
      );
    }
  }, [openInEditMode, profile, startEditing, setSearchParams]);

  if (loading) {
    return (
      <div className="academy-account" data-testid="academy-account-page">
        <div className="academy-account-loading" data-testid="account-loading">
          <div className="account-hero-banner">
            <div className="account-hero-banner__graphic" aria-hidden="true" />
            <div className="account-hero-banner__body">
              <div className="account-hero-banner__avatar account-hero-banner__avatar--skeleton">
                <Skeleton.Avatar active size={152} shape="circle" />
              </div>
              <div className="account-hero-banner__info">
                <Skeleton
                  active
                  title={{ width: 200 }}
                  paragraph={{ rows: 1, width: 160 }}
                />
              </div>
              <div className="account-hero-banner__actions">
                <Skeleton.Button active />
                <Skeleton.Button active />
              </div>
            </div>
          </div>

          <div className="academy-account-cards">
            <div className="academy-account-card">
              <div className="academy-account-card__header">
                <Skeleton
                  active
                  title={{ width: 140 }}
                  paragraph={{ rows: 1, width: 260 }}
                />
              </div>
              <div className="academy-account-card__grid">
                <Skeleton.Input active block />
                <Skeleton.Input active block />
              </div>
              <div className="academy-account-card__full-width">
                <Skeleton.Input active block />
              </div>
            </div>

            <div className="academy-account-card">
              <div className="academy-account-card__header">
                <Skeleton
                  active
                  title={{ width: 150 }}
                  paragraph={{ rows: 1, width: 260 }}
                />
              </div>
              <div className="academy-account-card__grid">
                <Skeleton.Input active block />
                <Skeleton.Input active block />
              </div>
              <div className="academy-account-card__grid">
                <Skeleton.Input active block />
                <Skeleton.Input active block />
              </div>
              <div className="academy-account-card__commodities">
                <div className="commodity-tag-selector">
                  <Skeleton.Button active size="small" />
                  <Skeleton.Button active size="small" />
                  <Skeleton.Button active size="small" />
                  <Skeleton.Button active size="small" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="academy-account" data-testid="academy-account-page">
        <Result
          status="error"
          title="Failed to load profile"
          subTitle={error}
          extra={
            <Button
              type="primary"
              data-testid="account-error-retry"
              onClick={() => fetchProfileData()}
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="academy-account" data-testid="academy-account-page">
      {requiredMissing.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Please complete the highlighted details"
          className="academy-account-incomplete"
          data-testid="profile-incomplete-alert"
        />
      )}
      {saveError && (
        <Alert
          type="error"
          showIcon
          closable
          message={saveError}
          onClose={() => setSaveError(null)}
          className="academy-account-save-error"
          data-testid="account-save-error"
        />
      )}
      <Form
        form={form}
        layout="vertical"
        requiredMark={isEditing}
        onFinish={handleSave}
        className="academy-account-form"
        data-testid="academy-account-form"
      >
        <AccountHeroBanner
          initials={initials}
          fullName={displayFullName}
          email={userState?.email || ""}
          tools={tools}
          isEditing={isEditing}
          saving={saving}
          onEdit={startEditing}
          onCancel={handleCancel}
        />
        <div className="academy-account-cards">
          <PersonalInfoCard
            isEditing={isEditing}
            email={userState?.email || ""}
          />
          <AdditionalInfoCard
            isEditing={isEditing}
            companyPlaceholder={companyPlaceholder}
            currentValues={formValues}
            role={userState?.role}
            idhCompanyName={idhCompanyName}
            companyRequired={!idhCompanyName}
          />
          <SettingsLinkCard
            settingsPath={
              isAcademyContext ? routePath.academy.settings : routePath.settings
            }
          />
        </div>
      </Form>
    </div>
  );
};

export default MyProfilePage;
