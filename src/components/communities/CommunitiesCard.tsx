import { JSX, useEffect, useRef, useState } from "react";
import { Community } from "./types";
import CommunityItem from "./CommunityItem";
import "../../styles/CommunitiesCard.css";

interface CommunitiesCardProps {
  cellId: string | null;
  onClose: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

async function fetchCommunitiesForCell(cellId: string): Promise<Community[]> {
  const res = await fetch(
    `${BACKEND_URL}/CommunitiesByCellId?cellId=${cellId}`,
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

  // Prevent wheel events on the card body from reaching the map
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const stop = (e: WheelEvent): void => e.stopPropagation();
    el.addEventListener("wheel", stop, { passive: true });
    return () => el.removeEventListener("wheel", stop);
  }, []);

  const loading = isOpen && result?.cellId !== cellId;
  const communities =
    !loading && result?.cellId === cellId ? result.communities : [];
  const error = !loading && result?.cellId === cellId ? result.error : null;

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
          <button
            className="communities-card-close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <svg
              width="16"
              height="16"
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
