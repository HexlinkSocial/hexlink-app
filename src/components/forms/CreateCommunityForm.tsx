import React from "react";
import FormOverlay from "./FormOverlay";

interface CommunityData {
  name: string;
  description: string;
  url: string;
}

interface CreateCommunityFormProps {
  isOpen: boolean;
  isSubmitting: boolean;
  communityData: CommunityData;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({
  isOpen,
  isSubmitting,
  communityData,
  errorMessage,
  onCancel,
  onSubmit,
  onInputChange,
}) => {
  return (
    <FormOverlay
      isOpen={isOpen}
      title="Create Community"
      submitLabel="Create"
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <div className="form-fields-body">
        <div className="form-group">
          <label htmlFor="name">Community Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={communityData.name}
            onChange={onInputChange}
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
            onChange={onInputChange}
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
            onChange={onInputChange}
            placeholder="example.com"
          />
        </div>

        {errorMessage != null && (
          <div className="form-error-message">{errorMessage}</div>
        )}
      </div>
    </FormOverlay>
  );
};

export default CreateCommunityForm;
