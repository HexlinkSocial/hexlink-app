import React, { useState, useEffect } from "react";
import { useMapBuilder } from "../../hooks/useMapBuilder";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import type { CameraState } from "../../hooks/useMapCore";
import SelectionLegend from "./components/SelectionLegend";
import CreateCommunityForm from "../forms/CreateCommunityForm";
import {
  buildPayload,
  clearPending,
  CommunityPayload,
  loadPending,
  loadPendingToken,
  postCommunity,
  savePending,
} from "../../helpers/userCommunitiesApiHelpers";
import Banner from "../Banner";
import { useAuth } from "../../hooks/useAuth";
import { logger } from "../../helpers/logger";

const MAX_SELECTIONS = 50;
const STORAGE_KEY_FORM = "draft_community_form_data";

interface DraftData {
  name: string;
  description: string;
  whatsapp: string;
  discord: string;
  facebook: string;
  other: string;
  agreedToTerms: boolean;
}

const DEFAULT_COMMUNITY_DATA: DraftData = {
  name: "",
  description: "",
  whatsapp: "",
  discord: "",
  facebook: "",
  other: "",
  agreedToTerms: false,
};

const getStoredDraft = (): DraftData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_FORM);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const storeDraft = (data: DraftData): void => {
  try {
    localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(data));
  } catch (err) {
    logger.error(`Failed saving form to localStorage ${err}`);
  }
};

const removeStoredDraft = (): void => {
  localStorage.removeItem(STORAGE_KEY_FORM);
};

const BuilderMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialCamera?: CameraState;
  onDismissError: (err: string) => void;
  dismissedError: unknown;
  onCancel: () => void;
  onSuccess: () => void;
}> = ({
  containerRef,
  initialCamera,
  onDismissError,
  dismissedError,
  onCancel,
  onSuccess,
}) => {
  const { map, isMapReady, error, selectedIds } = useMapBuilder(
    containerRef,
    initialCamera,
    { maxSelections: MAX_SELECTIONS },
  );
  useH3LayerStack(map, isMapReady);

  useEffect(() => {
    if (error) {
      logger.error(
        `DisplayMap: Map layers failed to load or initialize: ${error}`,
      );
    }
  }, [error, isMapReady]);

  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();

  const [step, setStep] = useState<"select" | "form">("select");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [limitBannerDismissed, setLimitBannerDismissed] = useState(false);
  const [communityData, setCommunityData] = useState<DraftData>(
    (): DraftData => getStoredDraft() ?? DEFAULT_COMMUNITY_DATA,
  );

  const activeError = error != null && error !== dismissedError ? error : null;
  const isAtLimit = selectedIds.size >= MAX_SELECTIONS;
  const limitWarning =
    isAtLimit && !limitBannerDismissed
      ? `Maximum of ${MAX_SELECTIONS} cells selected.`
      : null;

  useEffect(() => {
    if (!isAtLimit) setLimitBannerDismissed(false);
  }, [isAtLimit]);

  async function submit(
    payload: CommunityPayload,
    captchaToken?: string,
  ): Promise<void> {
    setIsSubmitting(true);
    setSubmitError(null);
    setStep("form");
    try {
      await postCommunity(payload, captchaToken);
      removeStoredDraft();
      onSuccess();
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong, please try again.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading || !isLoggedIn) return;
    const pending = loadPending();
    if (pending == null) return;
    const pendingToken = loadPendingToken() ?? undefined;
    clearPending();
    void submit(pending, pendingToken);
  }, [isAuthLoading, isLoggedIn]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setCommunityData((prev) => {
      const updated = { ...prev, [name]: value };
      storeDraft(updated);
      return updated;
    });
  };

  const handleAgreeChange = (checked: boolean): void => {
    setCommunityData((prev) => {
      const updated = { ...prev, agreedToTerms: checked };
      storeDraft(updated);
      return updated;
    });
  };

  const handleFormReset = (): void => {
    setSubmitError(null);
    removeStoredDraft();
    setCommunityData(DEFAULT_COMMUNITY_DATA);
    setStep("select");
  };

  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    communityToken?: string,
    registerToken?: string,
  ): Promise<void> => {
    e.preventDefault();
    setSubmitError(null);

    if (isAuthLoading) {
      setSubmitError("Still checking your login status, please try again.");
      return;
    }

    const payload = buildPayload(communityData, selectedIds);

    if (isLoggedIn) {
      await submit(payload, communityToken);
      return;
    }

    savePending(payload, communityToken);
    storeDraft(communityData);
    if (registerToken) {
      sessionStorage.setItem("pendingCaptchaToken", registerToken);
    }
    window.location.href = "/join";
  };

  return (
    <>
      <Banner message={activeError} onClose={() => onDismissError(error!)} />
      <Banner
        message={limitWarning}
        subtext="Deselect a cell to select a different one."
        variant="warning"
        onClose={() => setLimitBannerDismissed(true)}
      />

      {step === "select" && (
        <SelectionLegend
          selectedCount={selectedIds.size}
          onCancel={onCancel}
          onNext={() => setStep("form")}
        />
      )}

      <CreateCommunityForm
        isOpen={step === "form"}
        isSubmitting={isSubmitting}
        communityData={communityData}
        errorMessage={submitError}
        isLoggedIn={isLoggedIn}
        agreedToTerms={communityData.agreedToTerms}
        onAgreeChange={handleAgreeChange}
        onCancel={handleFormReset}
        onSubmit={handleFormSubmit}
        onInputChange={handleInputChange}
      />
    </>
  );
};

export default BuilderMap;
