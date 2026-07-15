import React, { useState, useEffect } from "react";
import FormOverlay from "./FormOverlay";
import {
  CommunityFormFields,
  SharedCommunityFormData,
} from "./CommunityFormFields";
import { validateCommunityData } from "../../helpers/communityFormValidate";
import { useTurnstile } from "../../hooks/useTurnstile";
import { TurnstileOverlay } from "../TurnstileOverlay";

interface CreateCommunityFormProps {
  isOpen: boolean;
  isSubmitting: boolean;
  communityData: SharedCommunityFormData;
  errorMessage: string | null;
  isLoggedIn: boolean;
  onCancel: () => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    communityToken?: string,
    registerToken?: string,
  ) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({
  isOpen,
  isSubmitting,
  communityData,
  errorMessage,
  isLoggedIn,
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

  const {
    executeChallenge: executeCommunityChallenge,
    isOpen: isCommunityTurnstileOpen,
    containerRef: communityContainerRef,
  } = useTurnstile({
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  });

  const {
    executeChallenge: executeRegisterChallenge,
    isOpen: isRegisterTurnstileOpen,
    containerRef: registerContainerRef,
  } = useTurnstile({
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  });

  const isFormInvalid = !isValid || !agreedToTerms;
  const isPendingSubmission =
    isSubmitting || isCommunityTurnstileOpen || isRegisterTurnstileOpen;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (isFormInvalid || isPendingSubmission) {
      return;
    }

    try {
      const communityToken = await executeCommunityChallenge();
      let registerToken: string | undefined = undefined;

      if (!isLoggedIn) {
        registerToken = await executeRegisterChallenge();
      }

      onSubmit(e, communityToken, registerToken);
    } catch (error) {
      console.error("Captcha verification failed:", error);
    }
  };

  const termsUrl = import.meta.env.VITE_TERMS_URL ?? "#";
  const privacyUrl = import.meta.env.VITE_PRIVACY_URL ?? "#";
  const guidelinesUrl = import.meta.env.VITE_GUIDELINES_URL ?? "#";

  return (
    <>
      <FormOverlay
        isOpen={isOpen}
        title="Create Community"
        submitLabel="Create"
        isSubmitting={isSubmitting}
        isDisabled={isFormInvalid || isPendingSubmission}
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

      {isCommunityTurnstileOpen && (
        <TurnstileOverlay containerRef={communityContainerRef} />
      )}
      {isRegisterTurnstileOpen && (
        <TurnstileOverlay containerRef={registerContainerRef} />
      )}
    </>
  );
};

export default CreateCommunityForm;
