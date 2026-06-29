import React, { JSX, useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useAuth } from "../hooks/useAuth";
import Banner from "../components/Banner";
import {
  fetchUserCommunities,
  editCommunity,
  UnifiedCommunityItem,
} from "../helpers/userCommunitiesApiHelpers";
import CommunityManagementCard from "../components/table/Manage/CommunityManagementCard";
import EditCommunityForm from "../components/forms/EditCommunityForm";

export default function UserCommunitiesDashboard(): JSX.Element {
  const { signOut } = useAuthenticator();
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();

  const [items, setItems] = useState<UnifiedCommunityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<UnifiedCommunityItem | null>(
    null,
  );
  const [formFields, setFormFields] = useState({
    name: "",
    description: "",
    url: "",
  });

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setApiError(null);
      const alignedData = await fetchUserCommunities();
      setItems(alignedData);
    } catch (error) {
      console.error("Failed loading local dashboard communities:", error);
      setApiError(
        error instanceof Error
          ? error.message
          : "Unknown error processing layout",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (isLoggedIn) {
      void loadData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, isAuthLoading, loadData]);

  const handleEditClick = (item: UnifiedCommunityItem): void => {
    setActiveItem(item);
    setFormFields({
      name: item.name,
      description: item.description ?? "",
      url: item.communityLink ?? "",
    });
    setIsFormOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!activeItem) return;

    try {
      setIsSubmitting(true);
      setApiError(null);

      await editCommunity({
        id: activeItem.id,
        name: formFields.name,
        description: formFields.description,
        communityLink: formFields.url,
      });

      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Error saving changes",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="table-container">
        <div className="communities-card__spinner" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="table-container">
      <div className="table-header-row">
        <h1 className="table-header-row__title">My Communities</h1>
        <div className="table-header-row__actions">
          <Link to="/" className="btn btn--primary">
            Home
          </Link>
          <button className="btn btn--primary" onClick={signOut}>
            Log out
          </button>
        </div>
      </div>

      <Banner message={apiError} onClose={() => setApiError(null)} />

      {items.length === 0 ? (
        <div className="table-container__empty-state">
          You don&apos;t own any communities yet.
        </div>
      ) : (
        <div className="table-container__grid">
          {items.map((item) => (
            <CommunityManagementCard
              key={item.id}
              item={item}
              onEditClick={handleEditClick}
            />
          ))}
        </div>
      )}

      <EditCommunityForm
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        originalData={activeItem}
        formData={formFields}
        errorMessage={apiError}
        onCancel={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        onInputChange={handleInputChange}
      />
    </div>
  );
}
