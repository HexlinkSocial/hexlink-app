import React from "react";
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
  onCancel: () => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    captchaToken?: string,
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
  onCancel,
  onSubmit,
  onInputChange,
}) => {
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
    executeChallenge,
    isOpen: isTurnstileOpen,
    containerRef,
  } = useTurnstile({
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  });

  const isFormInvalid = !isValid;
  const isPendingSubmission = isSubmitting || isTurnstileOpen;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (isFormInvalid || isPendingSubmission) {
      return;
    }

    try {
      const token = await executeChallenge();
      onSubmit(e, token);
    } catch (error) {
      console.error("Captcha verification failed:", error);
    }
  };

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
      </FormOverlay>

      {isTurnstileOpen && <TurnstileOverlay containerRef={containerRef} />}
    </>
  );
};

export default CreateCommunityForm;
