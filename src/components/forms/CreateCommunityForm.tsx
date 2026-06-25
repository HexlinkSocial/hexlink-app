import React from "react";
import FormOverlay from "./FormOverlay";

interface CommunityData {
  name: string;
  description: string;
  url: string;
}

interface CreateCommunityFormProps {
  isOpen: boolean;
  isSubmitting: boolean;
  communityData: CommunityData;
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
  const isNameOverLimit = communityData.name.length > 100;
  const isDescriptionOverLimit = communityData.description.length > 3000;

  const urlRegex =
    /^(?:https?:\/\/)?(?:www\.)?[-a-zA-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-zA-Z0-9()@:%_+.~#?&//=]*)$/;
  const isUrlInvalid =
    communityData.url.length > 0 && !urlRegex.test(communityData.url);

  const isFormInvalid =
    isNameOverLimit || isDescriptionOverLimit || isUrlInvalid;

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
      <div className="form__fields">
        <div className="form__group">
          <label htmlFor="name">Community Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={communityData.name}
            onChange={onInputChange}
            placeholder="e.g. Westside Gardeners"
            className={isNameOverLimit ? "form__input--error" : ""}
          />
          {isNameOverLimit && (
            <div className="form__error">
              Name cannot exceed 100 characters (currently{" "}
              {communityData.name.length}/100)
            </div>
          )}
        </div>
        <div className="form__group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            value={communityData.description}
            onChange={onInputChange}
            placeholder="What is your community about?"
            className={isDescriptionOverLimit ? "form__input--error" : ""}
          />
          {isDescriptionOverLimit && (
            <div className="form__error">
              Description cannot exceed 3000 characters (currently{" "}
              {communityData.description.length}/3000)
            </div>
          )}
        </div>
        <div className="form__group">
          <label htmlFor="url">Community URL</label>
          <input
            id="url"
            name="url"
            type="text"
            required
            value={communityData.url}
            onChange={onInputChange}
            placeholder="example.com"
            className={isUrlInvalid ? "form__input--error" : ""}
          />
          {isUrlInvalid && (
            <div className="form__error">
              Please enter a valid URL (e.g., example.com)
            </div>
          )}
        </div>
        {errorMessage != null && (
          <div className="form__error">{errorMessage}</div>
        )}
      </div>
    </FormOverlay>
  );
};

export default CreateCommunityForm;
