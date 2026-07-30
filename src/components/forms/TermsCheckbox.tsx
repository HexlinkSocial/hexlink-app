import React from "react";

interface TermsCheckboxProps {
  isDisabled: boolean;
  agreedToTerms: boolean;
  onAgreeChange: (checked: boolean) => void;
  guidelinesUrl: string;
  termsUrl: string;
  privacyUrl: string;
}

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  isDisabled,
  agreedToTerms,
  onAgreeChange,
  guidelinesUrl,
  termsUrl,
  privacyUrl,
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
            Community Guidelines
          </a>
          . I agree to the{" "}
          <a href={termsUrl} target="_blank" rel="noopener noreferrer">
            Terms & Conditions
          </a>{" "}
          and acknowledge the{" "}
          <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          .
        </span>
      </label>
    </div>
  );
};
