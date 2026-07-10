import React from "react";

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
        <label htmlFor="whatsapp">WhatsApp Link</label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="text"
          value={formData.whatsapp}
          onChange={onInputChange}
          placeholder={placeholderWhatsapp}
          className={isWhatsappInvalid ? "form__input--error" : ""}
        />
        {isWhatsappInvalid && (
          <div className="form__error">WhatsApp URL format is incorrect</div>
        )}
      </div>

      <div className="form__group">
        <label htmlFor="discord">Discord Link</label>
        <input
          id="discord"
          name="discord"
          type="text"
          value={formData.discord}
          onChange={onInputChange}
          placeholder={placeholderDiscord}
          className={isDiscordInvalid ? "form__input--error" : ""}
        />
        {isDiscordInvalid && (
          <div className="form__error">Discord URL format is incorrect</div>
        )}
      </div>

      <div className="form__group">
        <label htmlFor="facebook">Facebook Link</label>
        <input
          id="facebook"
          name="facebook"
          type="text"
          value={formData.facebook}
          onChange={onInputChange}
          placeholder={placeholderFacebook}
          className={isFacebookInvalid ? "form__input--error" : ""}
        />
        {isFacebookInvalid && (
          <div className="form__error">Facebook URL format is incorrect</div>
        )}
      </div>

      <div className="form__group">
        <label htmlFor="other">Other</label>
        <input
          id="other"
          name="other"
          type="text"
          value={formData.other}
          onChange={onInputChange}
          placeholder={placeholderOther}
          className={isOtherInvalid ? "form__input--error" : ""}
        />
        {isOtherInvalid && (
          <div className="form__error">Other URL format is incorrect</div>
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
