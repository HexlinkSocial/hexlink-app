import { JSX } from "react";
import { Community } from "./types";
import CommunityItem from "./CommunityItem";

interface CommunitiesListProps {
  loading: boolean;
  error: string | null;
  communities: Community[];
  isOpen: boolean;
}

export default function CommunitiesList({
  loading,
  error,
  communities,
  isOpen,
}: CommunitiesListProps): JSX.Element | null {
  if (loading) {
    return (
      <div className="communities-card-state">
        <div className="communities-card-spinner" />
        <span>Loading communities…</span>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="communities-card-state communities-card-state--error">
        <span>⚠ Failed to load: {error}</span>
      </div>
    );
  }

  if (communities.length === 0 && isOpen) {
    return (
      <div className="communities-card-state">
        <span className="communities-card-empty-hex">⬡</span>
        <span>No communities in this tile yet.</span>
      </div>
    );
  }

  return (
    <ul className="communities-card-list">
      {communities.map((c) => (
        <li key={c.id}>
          <CommunityItem community={c} />
        </li>
      ))}
    </ul>
  );
}
