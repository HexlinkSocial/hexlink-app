import React, { useState, useEffect } from "react";
import FormOverlay from "./FormOverlay";
import {
  CommunityFormFields,
  SharedCommunityFormData,
} from "./CommunityFormFields";
import { validateCommunityData } from "../../helpers/communityFormValidate";

interface CreateCommunityFormProps {
  isOpen: boolean;
  isSubmitting: boolean;
  communityData: SharedCommunityFormData;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({
  isOpen,
  isSubmitting,
  communityData,
  errorMessage,
  onCancel,
  onSubmit,
  onInputChange,
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAgreedToTerms(false);
    }
  }, [isOpen]);

  const {
    isNameOverLimit,
    isDescriptionOverLimit,
    isWhatsappInvalid,
    isDiscordInvalid,
    isFacebookInvalid,
    isOtherInvalid,
    isValid,
  } = validateCommunityData(communityData);

  const isFormInvalid = !isValid || !agreedToTerms;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (isFormInvalid || isSubmitting) {
      return;
    }

    onSubmit(e);
  };

  const termsUrl = import.meta.env.VITE_TERMS_URL ?? "#";
  const privacyUrl = import.meta.env.VITE_PRIVACY_URL ?? "#";
  const guidelinesUrl = import.meta.env.VITE_GUIDELINES_URL ?? "#";

  return (
    <FormOverlay
      isOpen={isOpen}
      title="Create Community"
      submitLabel="Create"
      isSubmitting={isSubmitting}
      isDisabled={isFormInvalid || isSubmitting}
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      <CommunityFormFields
        formData={communityData}
        onInputChange={onInputChange}
        isNameOverLimit={isNameOverLimit}
        isDescriptionOverLimit={isDescriptionOverLimit}
        isWhatsappInvalid={isWhatsappInvalid}
        isDiscordInvalid={isDiscordInvalid}
        isFacebookInvalid={isFacebookInvalid}
        isOtherInvalid={isOtherInvalid}
        errorMessage={errorMessage}
        placeholderName="e.g. UK Friends"
        placeholderDescription="What is your community about?"
        placeholderWhatsapp="e.g. https://chat.whatsapp.com/abc123"
        placeholderDiscord="e.g. https://discord.gg/abc123"
        placeholderFacebook="e.g. https://facebook.com/groups/abc123"
        placeholderOther="e.g. mycommunity.com"
        rows={3}
      />

      <div className="community-form__legal-checkbox">
        <label>
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
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
    </FormOverlay>
  );
};

export default CreateCommunityForm;
