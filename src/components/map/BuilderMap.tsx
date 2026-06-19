import React, { useState } from "react";
import { useMapBuilder } from "../../hooks/useMapBuilder";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import ErrorBanner from "../ErrorBanner";
import type { CameraState } from "../../hooks/useMapCore";
import "../../styles/InfoCard.css";
import SelectionLegend from "./components/SelectionLegend";
import CreateCommunityForm from "../forms/CreateCommunityForm";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

const BuilderMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialCamera?: CameraState;
  onDismissError: (err: string) => void;
  dismissedError: unknown;
  onCancel: () => void;
}> = ({
  containerRef,
  initialCamera,
  onDismissError,
  dismissedError,
  onCancel,
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCommunityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let finalUrl = communityData.url.trim();
      if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `http://${finalUrl}`;
      }

      const payload = {
        name: communityData.name,
        description: communityData.description,
        communityLink: finalUrl,
        owner: "user_placeholder_id", // TODO get cognito user ID after register/log in
        cellIds: Array.from(selectedIds),
      };

      const res = await fetch(`${BACKEND_URL}/CreateCommunity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Database insertion failure");

      onCancel();
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ErrorBanner error={activeError} onClose={() => onDismissError(error!)} />

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
