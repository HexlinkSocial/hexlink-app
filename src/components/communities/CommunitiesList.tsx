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
      <div className="communities-card__state">
        <div className="communities-card__spinner" />
        <span>Loading communities…</span>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="communities-card__state communities-card__state--error">
        <span>⚠ Failed to load: {error}</span>
      </div>
    );
  }

  if (communities.length === 0 && isOpen) {
    return (
      <div className="communities-card__state">
        <span className="communities-card__empty-hex">⬡</span>
        <span>No communities in this tile yet.</span>
      </div>
    );
  }

  return (
    <ul className="communities-card__list">
      {communities.map((c) => (
        <li key={c.id}>
          <CommunityItem community={c} />
        </li>
      ))}
    </ul>
  );
}
