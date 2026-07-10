import { JSX, useEffect, useRef, useState } from "react";
import { Community } from "./types";
import CommunitiesList from "./CommunitiesList";

interface CommunitiesCardProps {
  cellId: string | null;
  hasCommunities: boolean;
  onClose: () => void;
  onAddCommunityClick: () => void;
}

interface FetchResult {
  cellId: string;
  communities?: Community[];
  error: string | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

async function fetchCommunitiesForCell(cellId: string): Promise<Community[]> {
  const res = await fetch(
    `${BACKEND_URL}/CommunitiesByCellId?cellId=${cellId}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Community[]>;
}

export default function CommunitiesCard({
  cellId,
  hasCommunities,
  onClose,
  onAddCommunityClick,
}: CommunitiesCardProps): JSX.Element {
  const [result, setResult] = useState<FetchResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let id: number;
    let timeoutId: ReturnType<typeof setTimeout>;
    if (cellId !== null) {
      id = requestAnimationFrame(() => setIsVisible(true));
    } else {
      timeoutId = setTimeout(() => setIsVisible(false), 0);
    }
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(timeoutId);
    };
  }, [cellId]);

  const isOpen = cellId !== null;

  useEffect(() => {
    if (cellId == null || !hasCommunities) return;

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
  }, [cellId, hasCommunities]);

  // Prevent mouse wheel events on the card body from reaching the map
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const stop = (e: WheelEvent): void => e.stopPropagation();
    el.addEventListener("wheel", stop, { passive: true });

    return () => el.removeEventListener("wheel", stop);
  }, []);

  const loading = isOpen && hasCommunities && result?.cellId !== cellId;

  const communities =
    hasCommunities &&
    !loading &&
    result?.cellId === cellId &&
    result?.communities
      ? result.communities
      : [];

  const error =
    hasCommunities &&
    !loading &&
    result?.cellId === cellId &&
    result?.error != null
      ? result.error
      : null;

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
        className={`communities-card${isVisible ? " communities-card--open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="communities-card__header">
          <button
            className="btn-icon-close"
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
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="communities-card__body" ref={scrollRef}>
          <CommunitiesList
            loading={loading}
            error={error}
            communities={communities}
            isOpen={isOpen}
          />
        </div>
        <button
          className="btn btn--primary btn--form-block"
          onClick={onAddCommunityClick}
        >
          Add community
        </button>
      </div>
    </>
  );
}
