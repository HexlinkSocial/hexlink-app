import React, { useState } from "react";
import { useMapBuilder } from "../../hooks/useMapBuilder";
import { useH3LayerStack } from "../../hooks/useH3LayerStack";
import ErrorBanner from "../ErrorBanner";
import type { CameraState } from "../../hooks/useMapCore";
import "../../styles/InfoCard.css";
import FormOverlay from "../Forms/FormOverlay";

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

    try {
      let finalUrl = communityData.url.trim();
      if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `http://${finalUrl}`;
      }

      const payload = {
        name: communityData.name,
        description: communityData.description,
        communityLink: finalUrl,
        owner: "user_placeholder_id",
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
      alert("Error saving community data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ErrorBanner error={activeError} onClose={() => onDismissError(error!)} />

      {step === "select" && (
        <div className="info-card">
          <p className="info-card-title">
            Please select the tiles where you want your community to be based
          </p>

          <div className="info-card-legend">
            <div className="info-card-legend-item">
              <span className="info-card-color color-selected" />
              <span>Selected ({selectedIds.size})</span>
            </div>
            <div className="info-card-legend-item">
              <span className="info-card-color color-available" />
              <span>Available for selection</span>
            </div>
            <div className="info-card-legend-item">
              <span className="info-card-color color-unavailable" />
              <span>Not available</span>
            </div>
          </div>

          <div className="info-card-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-submit"
              onClick={() => setStep("form")}
              disabled={selectedIds.size === 0}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <FormOverlay
        isOpen={step === "form"}
        title="Create Community"
        submitLabel="Create"
        isSubmitting={isSubmitting}
        onCancel={() => setStep("select")}
        onSubmit={handleFormSubmit}
      >
        <div className="form-group">
          <label htmlFor="name">Community Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={communityData.name}
            onChange={handleInputChange}
            placeholder="e.g. Westside Gardeners"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            value={communityData.description}
            onChange={handleInputChange}
            placeholder="What is your community about?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="url">Community URL</label>
          <input
            id="url"
            name="url"
            type="text"
            required
            value={communityData.url}
            onChange={handleInputChange}
            placeholder="example.com"
          />
        </div>
      </FormOverlay>
    </>
  );
};

export default BuilderMap;
