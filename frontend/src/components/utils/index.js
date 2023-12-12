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
