import { describe, it, expect } from "vitest";
import {
  validateCommunityData,
  NAME_LIMIT,
  DESCRIPTION_LIMIT,
} from "./communityFormValidate";
import { SharedCommunityFormData } from "../components/forms/CommunityFormFields";

describe("validateCommunityData", () => {
  const validBaseData: SharedCommunityFormData = {
    name: "Valid Community Name",
    description: "This is a valid, well-described community description.",
    whatsapp: "https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv",
    discord: "https://discord.gg/valid-invite",
    facebook: "https://facebook.com/valid-page",
    other: "https://example.com",
  };

  it("should validate a completely correct data payload", () => {
    const result = validateCommunityData(validBaseData);
    expect(result.isValid).toBe(true);
    expect(result.isNameOverLimit).toBe(false);
    expect(result.isDescriptionOverLimit).toBe(false);
    expect(result.isWhatsappInvalid).toBe(false);
    expect(result.isDiscordInvalid).toBe(false);
    expect(result.isFacebookInvalid).toBe(false);
    expect(result.isOtherInvalid).toBe(false);
    expect(result.hasNoUrls).toBe(false);
  });

  it("should invalidate when name is empty or just whitespace", () => {
    const dataWithEmptyName: SharedCommunityFormData = {
      ...validBaseData,
      name: "   ",
    };
    const result = validateCommunityData(dataWithEmptyName);
    expect(result.isValid).toBe(false);
  });

  it("should invalidate when description is empty", () => {
    const dataWithEmptyDesc: SharedCommunityFormData = {
      ...validBaseData,
      description: "",
    };
    const result = validateCommunityData(dataWithEmptyDesc);
    expect(result.isValid).toBe(false);
  });

  it("should flag name when it exceeds the limit", () => {
    const longName = "a".repeat(NAME_LIMIT + 1);
    const dataWithLongName: SharedCommunityFormData = {
      ...validBaseData,
      name: longName,
    };
    const result = validateCommunityData(dataWithLongName);
    expect(result.isNameOverLimit).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should flag description when it exceeds the limit", () => {
    const longDesc = "a".repeat(DESCRIPTION_LIMIT + 1);
    const dataWithLongDesc: SharedCommunityFormData = {
      ...validBaseData,
      description: longDesc,
    };
    const result = validateCommunityData(dataWithLongDesc);
    expect(result.isDescriptionOverLimit).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should flag invalid social links but allow correct ones", () => {
    const invalidUrls: SharedCommunityFormData = {
      ...validBaseData,
      whatsapp: "https://not-whatsapp.com/group",
      discord: "https://discord.invalid/invite",
      facebook: "https://face-book.com/group",
      other: "invalid-url-no-domain",
    };

    const result = validateCommunityData(invalidUrls);
    expect(result.isWhatsappInvalid).toBe(true);
    expect(result.isDiscordInvalid).toBe(true);
    expect(result.isFacebookInvalid).toBe(true);
    expect(result.isOtherInvalid).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should flag when all social urls are completely omitted", () => {
    const noUrlsData: SharedCommunityFormData = {
      name: "Test Community",
      description: "Test Description",
      whatsapp: "",
      discord: "   ",
      facebook: "",
      other: "",
    };

    const result = validateCommunityData(noUrlsData);
    expect(result.hasNoUrls).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should validate successfully if at least one URL is valid and others are empty", () => {
    const singleUrlData: SharedCommunityFormData = {
      name: "Test Community",
      description: "Test Description",
      whatsapp: "https://chat.whatsapp.com/AbCdEf",
      discord: "",
      facebook: "",
      other: "",
    };

    const result = validateCommunityData(singleUrlData);
    expect(result.hasNoUrls).toBe(false);
    expect(result.isValid).toBe(true);
  });
});