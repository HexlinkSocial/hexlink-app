import { SharedCommunityFormData } from "../components/forms/CommunityFormFields";

export const NAME_LIMIT = 100;
export const DESCRIPTION_LIMIT = 3000;

export const urlRegex =
  /^(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
export const whatsappRegex =
  /^(?:https?:\/\/)?(?:www\.)?(?:chat\.whatsapp\.com|wa\.me)\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

export const discordRegex =
  /^(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com)\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

export const facebookRegex =
  /^(?:https?:\/\/)?(?:www\.)?facebook\.com\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

interface CommunityValidationResult {
  isNameOverLimit: boolean;
  isDescriptionOverLimit: boolean;
  isWhatsappInvalid: boolean;
  isDiscordInvalid: boolean;
  isFacebookInvalid: boolean;
  isOtherInvalid: boolean;
  hasNoUrls: boolean;
  isValid: boolean;
}

const isUrlInvalid = (value: string | undefined, regex: RegExp): boolean => {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 && !regex.test(trimmed);
};

export const validateCommunityData = (
  data: SharedCommunityFormData,
): CommunityValidationResult => {
  const nameText = (data?.name ?? "").trim();
  const descriptionText = (data?.description ?? "").trim();

  const isNameOverLimit = nameText.length > NAME_LIMIT;
  const isDescriptionOverLimit = descriptionText.length > DESCRIPTION_LIMIT;

  const isWhatsappInvalid = isUrlInvalid(data?.whatsapp, whatsappRegex);
  const isDiscordInvalid = isUrlInvalid(data?.discord, discordRegex);
  const isFacebookInvalid = isUrlInvalid(data?.facebook, facebookRegex);
  const isOtherInvalid = isUrlInvalid(data?.other, urlRegex);

  const hasNoUrls =
    !(data?.whatsapp ?? "").trim() &&
    !(data?.discord ?? "").trim() &&
    !(data?.facebook ?? "").trim() &&
    !(data?.other ?? "").trim();

  const isValid =
    nameText.length > 0 &&
    descriptionText.length > 0 &&
    !isNameOverLimit &&
    !isDescriptionOverLimit &&
    !isWhatsappInvalid &&
    !isDiscordInvalid &&
    !isFacebookInvalid &&
    !isOtherInvalid &&
    !hasNoUrls;

  return {
    isNameOverLimit,
    isDescriptionOverLimit,
    isWhatsappInvalid,
    isDiscordInvalid,
    isFacebookInvalid,
    isOtherInvalid,
    hasNoUrls,
    isValid,
  };
};
