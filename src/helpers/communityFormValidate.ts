import { SharedCommunityFormData } from "../components/forms/CommunityFormFields";

export const NAME_LIMIT = 100;
export const DESCRIPTION_LIMIT = 3000;

export const urlRegex =
  /^(?:https?:\/\/)?(?:www\.)?[-a-zA-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-zA-Z0-9()@:%_+.~#?&//=]*)$/;

interface CommunityValidationResult {
  isNameOverLimit: boolean;
  isDescriptionOverLimit: boolean;
  isUrlInvalid: boolean;
  isValid: boolean;
}

export const validateCommunityData = (
  data: SharedCommunityFormData,
): CommunityValidationResult => {
  const isNameOverLimit = data.name.length > NAME_LIMIT;
  const isDescriptionOverLimit = data.description.length > DESCRIPTION_LIMIT;
  const isUrlInvalid = data.url.length > 0 && !urlRegex.test(data.url);

  return {
    isNameOverLimit,
    isDescriptionOverLimit,
    isUrlInvalid,
    isValid: !isNameOverLimit && !isDescriptionOverLimit && !isUrlInvalid,
  };
};
