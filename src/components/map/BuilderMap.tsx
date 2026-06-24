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
  getAuthUserEmail,
  getAuthUserId,
  loadPending,
  postCommunity,
  savePending,
} from "./helpers/builderMapHelpers";
import Banner from "../Banner";

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
  );
  useH3LayerStack(map, isMapReady);

  const [step, setStep] = useState<"select" | "form">("select");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [communityData, setCommunityData] = useState({
    name: "",
    description: "",
    url: "",
  });

  const activeError = error != null && error !== dismissedError ? error : null;

  async function submit(payload: CommunityPayload): Promise<void> {
    setIsSubmitting(true);
    setSubmitError(null);
    setStep("form");
    try {
      await postCommunity(payload);
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
    void (async (): Promise<void> => {
      const userId = await getAuthUserId();
      if (userId == null) return;
      clearPending();
      await submit({ ...pending, owner: userId });
    })();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setCommunityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setSubmitError(null);

    const userId = await getAuthUserId();
    const userEmail = await getAuthUserEmail();

    if (userId != null && userEmail != null) {
      await submit(buildPayload(communityData, selectedIds, userId, userEmail));
    } else {
      savePending(
        buildPayload(communityData, selectedIds, "PENDING", "PENDING"),
      );
      window.location.href = "/join";
    }
  };

  return (
    <>
      <Banner message={activeError} onClose={() => onDismissError(error!)} />

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
