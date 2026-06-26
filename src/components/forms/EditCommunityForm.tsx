import { JSX } from "react";
import { UnifiedCommunityItem } from "../../helpers/userCommunitiesApiHelpers";
import FormOverlay from "./FormOverlay";

interface EditCommunityFormProps {
  isOpen: boolean;
  isSubmitting: boolean;
  originalData: UnifiedCommunityItem | null;
  formData: { name: string; description: string; url: string };
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
  const isNameOverLimit = formData.name.length > 100;
  const isDescriptionOverLimit = formData.description.length > 3000;

  const urlRegex =
    /^(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-zA-Z0-9()@:%_+.~#?&//=]*)$/;
  const isUrlInvalid = formData.url.length > 0 && !urlRegex.test(formData.url);

  const hasNoChanges =
    originalData != null &&
    formData.name.trim() === originalData.name &&
    formData.description.trim() === (originalData.description || "") &&
    formData.url.trim() === (originalData.communityLink || "");

  const isFormInvalid =
    isNameOverLimit || isDescriptionOverLimit || isUrlInvalid || hasNoChanges;

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
            className={isNameOverLimit ? "form__input--error" : ""}
          />
          {isNameOverLimit && (
            <div className="form__error">
              Name cannot exceed 100 characters (currently{" "}
              {formData.name.length}/100)
            </div>
          )}
        </div>

        <div className="form__group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            value={formData.description}
            onChange={onInputChange}
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
            className={isUrlInvalid ? "form__input--error" : ""}
          />
          {isUrlInvalid && (
            <div className="form__error">Please enter a valid URL.</div>
          )}
        </div>

        {hasNoChanges && (
          <div className="form__error" style={{ color: "#71717a" }}>
            Modify at least one value to save changes.
          </div>
        )}

        {errorMessage != null && (
          <div className="form__error">{errorMessage}</div>
        )}
      </div>
    </FormOverlay>
  );
}

export default EditCommunityForm;
