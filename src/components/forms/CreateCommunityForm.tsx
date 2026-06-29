import React from "react";
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
  const { isNameOverLimit, isDescriptionOverLimit, isUrlInvalid, isValid } =
    validateCommunityData(communityData);

  const isFormInvalid = !isValid;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (isFormInvalid) {
      return;
    }
    onSubmit(e);
  };

  return (
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
  );
};

export default CreateCommunityForm;
