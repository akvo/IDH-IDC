export const passwordCheckBoxOptions = [
  { name: "Uppercase Character", re: /[A-Z]/ },
  { name: "Numbers", re: /\d/ },
  { name: "Special Character", re: /[-._!"`'#%&,:;<>=@{}~$()*+/?[\]^|]/ },
  { name: "Min 8 Character", re: /[^ ]{8}/ },
];

export const checkPasswordCriteria = (value) => {
  const criteria = passwordCheckBoxOptions
    .map((x) => {
      const available = x.re.test(value);
      return available ? x.name : false;
    })
    .filter((x) => x);
  return criteria;
};

export { default as SaveAsImageButton } from "./SaveAsImageButton";
export { default as PasswordCriteria } from "./PasswordCriteria";
export { default as ShowLabelButton } from "./ShowLabelButton";
export { default as DataSecurityProvisionModal } from "./DataSecurityProvisionModal";
export { default as ViewSummaryModal } from "./ViewSummaryModal";
export { default as OtherToolResourceList } from "./other-tools-and-resources/OtherToolResourceList";
export { default as NewCpiForm } from "./NewCpiForm";
export { default as OtherToolsAndResources } from "./other-tools-and-resources/OtherToolsAndResources";
export { default as Blocker } from "./blocker/Blocker";
