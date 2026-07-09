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
  postCommunity,
  savePending,
} from "../../helpers/userCommunitiesApiHelpers";
import Banner from "../Banner";

const MAX_SELECTIONS = 50;

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

  const [step, setStep] = useState<"select" | "form">("select");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [limitBannerDismissed, setLimitBannerDismissed] = useState(false);
  const [communityData, setCommunityData] = useState({
    name: "",
    description: "",
    url: "",
  });

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
      onSuccess();
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const pending = loadPending();
    if (pending == null) return;

    clearPending();
    void submit(pending);
  }, [submit]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setCommunityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    captchaToken?: string,
  ): Promise<void> => {
    e.preventDefault();
    setSubmitError(null);

    const payload = buildPayload(communityData, selectedIds);

    try {
      await submit(payload, captchaToken);
    } catch {
      savePending(payload);
      window.location.href = "/join";
    }
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
        onCancel={() => {
          setSubmitError(null);
          setStep("select");
        }}
        onSubmit={handleFormSubmit}
        onInputChange={handleInputChange}
      />
    </>
  );
};

export default BuilderMap;
