import { JSX, useEffect, useRef, useState } from "react";
import { Community } from "./types";
import CommunityItem from "./CommunityItem";
import "../../styles/CommunitiesCards.css";

interface CommunitiesCardProps {
  cellId: string | null;
  onClose: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

async function fetchCommunitiesForCell(cellId: string): Promise<Community[]> {
  const res = await fetch(
    `${BACKEND_URL}/getCommunitiesByCellId?cellId=${encodeURIComponent(cellId)}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Community[]>;
}

interface FetchResult {
  cellId: string;
  communities: Community[];
  error: string | null;
}

export default function CommunitiesCard({
  cellId,
  onClose,
}: CommunitiesCardProps): JSX.Element {
  const [result, setResult] = useState<FetchResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOpen = cellId !== null;

  useEffect(() => {
    if (cellId == null) return;

    let cancelled = false;

    fetchCommunitiesForCell(cellId)
      .then((data) => {
        if (!cancelled) setResult({ cellId, communities: data, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled)
          setResult({ cellId, communities: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [cellId]);

  // loading = we have an open cell but no result for it yet
  const loading = isOpen && result?.cellId !== cellId;
  const communities =
    !loading && result?.cellId === cellId ? result.communities : [];
  const error = !loading && result?.cellId === cellId ? result.error : null;

  const shortId =
    cellId !== null ? `${cellId.slice(0, 6)}…${cellId.slice(-4)}` : "";

  return (
    <>
      {isOpen && (
        <button
          className="communities-card-backdrop"
          onClick={onClose}
          aria-label="Close panel"
        />
      )}
      <div
        className={`communities-card ${isOpen ? "communities-card--open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="communities-card-header">
          <div className="communities-card-header-text">
            <span className="communities-card-eyebrow">Hex tile</span>
            <h2 className="communities-card-title">{shortId}</h2>
          </div>
          <button
            className="communities-card-close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L17 17M17 1L1 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="communities-card-body" ref={scrollRef}>
          {loading && (
            <div className="communities-card-state">
              <div className="communities-card-spinner" />
              <span>Loading communities…</span>
            </div>
          )}
          {!loading && error !== null && (
            <div className="communities-card-state communities-card-state--error">
              <span>⚠ Failed to load: {error}</span>
            </div>
          )}
          {!loading && error === null && communities.length === 0 && isOpen && (
            <div className="communities-card-state">
              <span className="communities-card-empty-hex">⬡</span>
              <span>No communities in this tile yet.</span>
            </div>
          )}
          {!loading && communities.length > 0 && (
            <ul className="communities-card-list">
              {communities.map((c) => (
                <li key={c.id}>
                  <CommunityItem community={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
