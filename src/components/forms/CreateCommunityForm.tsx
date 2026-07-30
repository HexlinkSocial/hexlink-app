import React from "react";
import FormOverlay from "./FormOverlay";
import {
  CommunityFormFields,
  SharedCommunityFormData,
} from "./CommunityFormFields";
import { validateCommunityData } from "../../helpers/communityFormValidate";
import { useTurnstile } from "../../hooks/useTurnstile";
import { TurnstileOverlay } from "../TurnstileOverlay";
import { TermsCheckbox } from "./TermsCheckbox";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import { getDocsUrl } from "../../helpers/docsUrl";

interface CreateCommunityFormProps {
  isOpen: boolean;
  isSubmitting: boolean;
  communityData: SharedCommunityFormData;
  errorMessage: string | null;
  isLoggedIn: boolean;
  agreedToTerms: boolean;
  onAgreeChange: (checked: boolean) => void;
  onCancel: () => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    communityToken?: string,
    registerToken?: string,
  ) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const FormHelpLink: React.FC = () => {
  const helpUrl = `${getDocsUrl("docs/tips-for-community-runners/creating-your-community")}#title`;

  return (
    <p className="info-card__help info-card__help--spaced">
      <a
        href={helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="info-card__help-link"
      >
        <span>Unsure what to put there?</span>
        <ExternalLinkIcon />
      </a>
    </p>
  );
};

const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({
  isOpen,
  isSubmitting,
  communityData,
  errorMessage,
  isLoggedIn,
  agreedToTerms,
  onAgreeChange,
  onCancel,
  onSubmit,
  onInputChange,
}) => {
  const {
    isNameOverLimit,
    isDescriptionOverLimit,
    isWhatsappInvalid,
    isDiscordInvalid,
    isFacebookInvalid,
    isOtherInvalid,
    isValid,
  } = validateCommunityData(communityData);

  const {
    executeChallenge: executeCommunityChallenge,
    isOpen: isCommunityTurnstileOpen,
    containerRef: communityContainerRef,
  } = useTurnstile({
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  });

  const {
    executeChallenge: executeRegisterChallenge,
    isOpen: isRegisterTurnstileOpen,
    containerRef: registerContainerRef,
  } = useTurnstile({
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  });

  const isFormInvalid = !isValid || !agreedToTerms;
  const isPendingSubmission =
    isSubmitting || isCommunityTurnstileOpen || isRegisterTurnstileOpen;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (isFormInvalid || isPendingSubmission) {
      return;
    }

    try {
      const communityToken = await executeCommunityChallenge();
      let registerToken: string | undefined = undefined;

      if (!isLoggedIn) {
        registerToken = await executeRegisterChallenge();
      }

      onSubmit(e, communityToken, registerToken);
    } catch (error) {
      console.error("Captcha verification failed:", error);
    }
  };

  const termsUrl =
    import.meta.env.VITE_TERMS_URL ??
    getDocsUrl("docs/governance/terms-and-conditions");
  const privacyUrl =
    import.meta.env.VITE_PRIVACY_URL ??
    getDocsUrl("docs/governance/privacy-policy");
  const guidelinesUrl =
    import.meta.env.VITE_GUIDELINES_URL ??
    getDocsUrl("docs/governance/community-guidelines");

  return (
    <>
      <FormOverlay
        isOpen={isOpen}
        title="Create Community"
        submitLabel="Create"
        isSubmitting={isSubmitting}
        isDisabled={isFormInvalid || isPendingSubmission}
        onCancel={onCancel}
        onSubmit={handleSubmit}
      >
        <FormHelpLink />

        <CommunityFormFields
          formData={communityData}
          onInputChange={onInputChange}
          isNameOverLimit={isNameOverLimit}
          isDescriptionOverLimit={isDescriptionOverLimit}
          isWhatsappInvalid={isWhatsappInvalid}
          isDiscordInvalid={isDiscordInvalid}
          isFacebookInvalid={isFacebookInvalid}
          isOtherInvalid={isOtherInvalid}
          errorMessage={errorMessage}
          placeholderName="e.g. UK Friends"
          placeholderDescription="What is your community about?"
          placeholderWhatsapp="e.g. https://chat.whatsapp.com/abc123"
          placeholderDiscord="e.g. https://discord.gg/abc123"
          placeholderFacebook="e.g. https://facebook.com/groups/abc123"
          placeholderOther="e.g. mycommunity.com"
          rows={3}
          isDisabled={isPendingSubmission}
        />

        <TermsCheckbox
          isDisabled={isPendingSubmission}
          agreedToTerms={agreedToTerms}
          onAgreeChange={onAgreeChange}
          guidelinesUrl={guidelinesUrl}
          termsUrl={termsUrl}
          privacyUrl={privacyUrl}
        />
      </FormOverlay>

      {isCommunityTurnstileOpen && (
        <TurnstileOverlay containerRef={communityContainerRef} />
      )}
      {isRegisterTurnstileOpen && (
        <TurnstileOverlay containerRef={registerContainerRef} />
      )}
    </>
  );
};

export default CreateCommunityForm;
