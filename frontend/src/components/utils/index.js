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

export const MapViewHelpText = ({ type, relevantPageMessage }) => {
  const styles = {
    textAlign: "center",
    fontStyle: "italic",
    width: "100%",
    fontSize: "13px",
  };

  switch (type) {
    case "hover-hint":
      return (
        <p style={{ ...styles }}>
          Hover over a country to view the {relevantPageMessage}.
        </p>
      );
    default:
      return (
        <p style={{ ...styles }}>
          The map is for illustrative purposes and do not imply the expression
          of any opinion on the part of IDH.
        </p>
      );
  }
};

export const sortStringItemsWithOrderedNumber = (items) =>
  items.sort((a, b) => {
    const numA = parseInt(a?.trim()?.split(".")?.[0], 10);
    const numB = parseInt(b?.trim()?.split(".")?.[0], 10);
    return numA - numB;
  });

export { default as SaveAsImageButton } from "./SaveAsImageButton";
export { default as PasswordCriteria } from "./PasswordCriteria";
export { default as ShowLabelButton } from "./ShowLabelButton";
export { default as DataSecurityProvisionModal } from "./DataSecurityProvisionModal";
export { default as ViewSummaryModal } from "./ViewSummaryModal";
export { default as OtherToolResourceList } from "./other-tools-and-resources/OtherToolResourceList";
export { default as NewCpiForm } from "./NewCpiForm";
export { default as OtherToolsAndResources } from "./other-tools-and-resources/OtherToolsAndResources";
export { default as Blocker } from "./blocker/Blocker";
export { default as ScrollToHash } from "./ScrollToHash";
