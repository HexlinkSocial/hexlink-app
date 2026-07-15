import React from "react";
import { FormInputField } from "./FormInputField";

export interface SharedCommunityFormData {
  name: string;
  description: string;
  whatsapp: string;
  discord: string;
  facebook: string;
  other: string;
}

export interface CommunityFormFieldsProps {
  formData: SharedCommunityFormData;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  isNameOverLimit: boolean;
  isDescriptionOverLimit: boolean;
  isWhatsappInvalid: boolean;
  isDiscordInvalid: boolean;
  isFacebookInvalid: boolean;
  isOtherInvalid: boolean;
  errorMessage: string | null;
  hasNoChanges?: boolean;
  placeholderName?: string;
  placeholderDescription?: string;
  placeholderWhatsapp?: string;
  placeholderDiscord?: string;
  placeholderFacebook?: string;
  placeholderOther?: string;
  rows?: number;
}

export const CommunityFormFields: React.FC<CommunityFormFieldsProps> = ({
  formData,
  onInputChange,
  isNameOverLimit,
  isDescriptionOverLimit,
  isWhatsappInvalid,
  isDiscordInvalid,
  isFacebookInvalid,
  isOtherInvalid,
  errorMessage,
  hasNoChanges = false,
  placeholderName,
  placeholderDescription,
  placeholderWhatsapp,
  placeholderDiscord,
  placeholderFacebook,
  placeholderOther,
  rows = 5,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e);
  };

  return (
    <div className="form__fields">
      <div className="form__group">
        <label htmlFor="name">Community Name *</label>
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
        <label htmlFor="description">Description *</label>
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

      <div className="form__group--hinted">
        <div className="form__hint">Enter at least one community link</div>
        <FormInputField
          id="whatsapp"
          name="whatsapp"
          label="WhatsApp Link"
          value={formData.whatsapp}
          onChange={handleInputChange}
          placeholder={placeholderWhatsapp}
          isInvalid={isWhatsappInvalid}
          errorMessage="WhatsApp URL format is incorrect"
        />
      </div>

      <FormInputField
        id="discord"
        name="discord"
        label="Discord Link"
        value={formData.discord}
        onChange={handleInputChange}
        placeholder={placeholderDiscord}
        isInvalid={isDiscordInvalid}
        errorMessage="Discord URL format is incorrect"
      />

      <FormInputField
        id="facebook"
        name="facebook"
        label="Facebook Link"
        value={formData.facebook}
        onChange={handleInputChange}
        placeholder={placeholderFacebook}
        isInvalid={isFacebookInvalid}
        errorMessage="Facebook URL format is incorrect"
      />

      <FormInputField
        id="other"
        name="other"
        label="Other"
        value={formData.other}
        onChange={handleInputChange}
        placeholder={placeholderOther}
        isInvalid={isOtherInvalid}
        errorMessage="Other URL format is incorrect"
      />

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
