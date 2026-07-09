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
  const { isNameOverLimit, isDescriptionOverLimit, isUrlInvalid, isValid } =
    validateCommunityData(communityData);

  const {
    executeChallenge,
    isOpen: isTurnstileOpen,
    containerRef,
  } = useTurnstile({
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  });

  const isFormInvalid = !isValid;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (isFormInvalid) {
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
        isDisabled={isFormInvalid}
        onCancel={onCancel}
        onSubmit={handleSubmit}
      >
        <CommunityFormFields
          formData={communityData}
          onInputChange={onInputChange}
          isNameOverLimit={isNameOverLimit}
          isDescriptionOverLimit={isDescriptionOverLimit}
          isUrlInvalid={isUrlInvalid}
          errorMessage={errorMessage}
          placeholderName="e.g. Westside Gardeners"
          placeholderDescription="What is your community about?"
          placeholderUrl="example.com"
          rows={3}
        />
      </FormOverlay>

      {isTurnstileOpen && <TurnstileOverlay containerRef={containerRef} />}
    </>
  );
};

export default CreateCommunityForm;
