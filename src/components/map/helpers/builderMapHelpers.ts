import { fetchAuthSession } from "aws-amplify/auth";

export type CommunityPayload = {
  name: string;
  description: string;
  communityLink: string;
  owner: string;
  ownerEmail: string;
  cellIds: string[];
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";
const PENDING_KEY = "pendingCommunityPayload";

function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`;
  return trimmed;
}

export function buildPayload(
  communityData: { name: string; description: string; url: string },
  selectedIds: Set<string>,
  owner: string,
  ownerEmail: string,
): CommunityPayload {
  return {
    name: communityData.name,
    description: communityData.description,
    communityLink: normaliseUrl(communityData.url),
    owner,
    ownerEmail,
    cellIds: Array.from(selectedIds),
  };
}

export async function postCommunity(payload: CommunityPayload): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/CreateCommunity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Database insertion failure");
}

export async function getAuthUserId(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return (session.tokens?.idToken?.payload?.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function getAuthUserEmail(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return (session.tokens?.idToken?.payload?.email as string) ?? null;
  } catch {
    return null;
  }
}

export function savePending(payload: CommunityPayload): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
}

export function loadPending(): CommunityPayload | null {
  const raw = sessionStorage.getItem(PENDING_KEY);
  return raw != null ? (JSON.parse(raw) as CommunityPayload) : null;
}

export function clearPending(): void {
  sessionStorage.removeItem(PENDING_KEY);
}
