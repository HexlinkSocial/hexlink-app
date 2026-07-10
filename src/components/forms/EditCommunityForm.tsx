import React, { JSX } from "react";
import { UnifiedCommunityItem } from "../../helpers/userCommunitiesApiHelpers";
import FormOverlay from "./FormOverlay";
import {
  CommunityFormFields,
  SharedCommunityFormData,
} from "./CommunityFormFields";
import { validateCommunityData } from "../../helpers/communityFormValidate";

interface EditCommunityFormProps {
  isOpen: boolean;
  isSubmitting: boolean;
  originalData: UnifiedCommunityItem | null;
  formData: SharedCommunityFormData;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

function EditCommunityForm({
  isOpen,
  isSubmitting,
  originalData,
  formData,
  errorMessage,
  onCancel,
  onSubmit,
  onInputChange,
}: EditCommunityFormProps): JSX.Element {
  const {
    isNameOverLimit,
    isDescriptionOverLimit,
    isWhatsappInvalid,
    isDiscordInvalid,
    isFacebookInvalid,
    isOtherInvalid,
    isValid,
  } = validateCommunityData(formData);

  const hasNoChanges =
    originalData != null &&
    (formData.name ?? "").trim() === originalData.name &&
    (formData.description ?? "").trim() === (originalData.description || "") &&
    (formData.whatsapp ?? "").trim() === (originalData.whatsapp || "") &&
    (formData.discord ?? "").trim() === (originalData.discord || "") &&
    (formData.facebook ?? "").trim() === (originalData.facebook || "") &&
    (formData.other ?? "").trim() === (originalData.other || "");

  const isFormInvalid = !isValid || hasNoChanges;

  return (
    <FormOverlay
      isOpen={isOpen}
      title="Edit Community"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      isDisabled={isFormInvalid}
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <CommunityFormFields
        formData={formData}
        onInputChange={onInputChange}
        isNameOverLimit={isNameOverLimit}
        isDescriptionOverLimit={isDescriptionOverLimit}
        isWhatsappInvalid={isWhatsappInvalid}
        isDiscordInvalid={isDiscordInvalid}
        isFacebookInvalid={isFacebookInvalid}
        isOtherInvalid={isOtherInvalid}
        errorMessage={errorMessage}
        hasNoChanges={hasNoChanges}
        rows={5}
      />
    </FormOverlay>
  );
}

export default EditCommunityForm;
