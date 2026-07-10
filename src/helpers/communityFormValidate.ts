import { SharedCommunityFormData } from "../components/forms/CommunityFormFields";

export const NAME_LIMIT = 100;
export const DESCRIPTION_LIMIT = 3000;

export const urlRegex =
  /^(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
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

export const validateCommunityData = (
  data: SharedCommunityFormData,
): CommunityValidationResult => {
  const nameText = (data?.name ?? "").trim();
  const descriptionText = (data?.description ?? "").trim();

  const isNameOverLimit = (data?.name ?? "").length > NAME_LIMIT;
  const isDescriptionOverLimit =
    (data?.description ?? "").length > DESCRIPTION_LIMIT;

  const trimmedWhatsapp = (data?.whatsapp ?? "").trim();
  const trimmedDiscord = (data?.discord ?? "").trim();
  const trimmedFacebook = (data?.facebook ?? "").trim();
  const trimmedOther = (data?.other ?? "").trim();

  const isWhatsappInvalid =
    trimmedWhatsapp.length > 0 && !whatsappRegex.test(trimmedWhatsapp);
  const isDiscordInvalid =
    trimmedDiscord.length > 0 && !discordRegex.test(trimmedDiscord);
  const isFacebookInvalid =
    trimmedFacebook.length > 0 && !facebookRegex.test(trimmedFacebook);
  const isOtherInvalid =
    trimmedOther.length > 0 && !urlRegex.test(trimmedOther);

  const hasNoUrls =
    trimmedWhatsapp.length === 0 &&
    trimmedDiscord.length === 0 &&
    trimmedFacebook.length === 0 &&
    trimmedOther.length === 0;

  const anyUrlInvalid =
    isWhatsappInvalid ||
    isDiscordInvalid ||
    isFacebookInvalid ||
    isOtherInvalid;

  const hasRequiredText = nameText.length > 0 && descriptionText.length > 0;

  const isValid =
    hasRequiredText &&
    !isNameOverLimit &&
    !isDescriptionOverLimit &&
    !anyUrlInvalid &&
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
