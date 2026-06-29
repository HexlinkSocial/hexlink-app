import React from "react";

export interface SharedCommunityFormData {
  name: string;
  description: string;
  url: string;
}

export interface CommunityFormFieldsProps {
  formData: SharedCommunityFormData;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  isNameOverLimit: boolean;
  isDescriptionOverLimit: boolean;
  isUrlInvalid: boolean;
  errorMessage: string | null;
  hasNoChanges?: boolean;
  placeholderName?: string;
  placeholderDescription?: string;
  placeholderUrl?: string;
  rows?: number;
}

export const CommunityFormFields: React.FC<CommunityFormFieldsProps> = ({
  formData,
  onInputChange,
  isNameOverLimit,
  isDescriptionOverLimit,
  isUrlInvalid,
  errorMessage,
  hasNoChanges = false,
  placeholderName,
  placeholderDescription,
  placeholderUrl,
  rows = 5,
}) => {
  return (
    <div className="form__fields">
      <div className="form__group">
        <label htmlFor="name">Community Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={onInputChange}
          placeholder={placeholderName}
          className={isNameOverLimit ? "form__input--error" : ""}
        />
        {isNameOverLimit && (
          <div className="form__error">
            Name cannot exceed 100 characters (currently {formData.name.length}
            /100)
          </div>
        )}
      </div>

      <div className="form__group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          required
          rows={rows}
          value={formData.description}
          onChange={onInputChange}
          placeholder={placeholderDescription}
          className={isDescriptionOverLimit ? "form__input--error" : ""}
        />
        {isDescriptionOverLimit && (
          <div className="form__error">
            Description cannot exceed 3000 characters (currently{" "}
            {formData.description.length}/3000)
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
          value={formData.url}
          onChange={onInputChange}
          placeholder={placeholderUrl}
          className={isUrlInvalid ? "form__input--error" : ""}
        />
        {isUrlInvalid && (
          <div className="form__error">
            Please enter a valid URL (e.g., example.com)
          </div>
        )}
      </div>

      {hasNoChanges && (
        <div className="form__error form__error--warning">
          Modify at least one value to save changes.
        </div>
      )}

      {errorMessage != null && (
        <div className="form__error">{errorMessage}</div>
      )}
    </div>
  );
};
