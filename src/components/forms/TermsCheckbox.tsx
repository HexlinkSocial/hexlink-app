import React from "react";

interface TermsCheckboxProps {
  isDisabled: boolean;
  agreedToTerms: boolean;
  onAgreeChange: (checked: boolean) => void;
  guidelinesUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

const getDocsUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_DOCS_URL ?? "https://docs.hexlink.org";
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\/|\/#/g, "")}`;
};

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  isDisabled,
  agreedToTerms,
  onAgreeChange,
  guidelinesUrl = getDocsUrl("docs/governance/community-guidelines"),
  termsUrl = getDocsUrl("docs/governance/terms-and-conditions"),
  privacyUrl = getDocsUrl("docs/governance/privacy-policy"),
}) => {
  return (
    <div className="community-form__legal-checkbox">
      <label>
        <input
          type="checkbox"
          disabled={isDisabled}
          checked={agreedToTerms}
          onChange={(e) => onAgreeChange(e.target.checked)}
        />
        <span>
          I confirm that this group adheres to the{" "}
          <a href={guidelinesUrl} target="_blank" rel="noopener noreferrer">
            <span>Community Guidelines</span>
          </a>
          . I agree to the{" "}
          <a href={termsUrl} target="_blank" rel="noopener noreferrer">
            <span>Terms & Conditions</span>
          </a>{" "}
          and acknowledge the{" "}
          <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
            <span>Privacy Policy</span>
          </a>
          .
        </span>
      </label>
    </div>
  );
};
