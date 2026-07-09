import { adminHeaders } from "./authHeaders";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";
const PENDING_KEY = "pendingCommunityPayload";

export type CommunityPayload = {
  name: string;
  description: string;
  communityLink: string;
  cellIds: string[];
};

export interface UnifiedCommunityItem {
  id: string;
  name: string;
  description: string;
  communityLink: string;
  status: "amendments_requested" | "pending" | "approved";
  comments?: string | null;
}

export interface UserCommunitiesPayload {
  approvals: Array<{
    id: string;
    name: string;
    description: string | null;
    communityLink: string | null;
    status: string;
    comments?: string | null;
  }>;
  communities: Array<{
    id: string;
    name: string;
    description: string | null;
    communityLink: string | null;
  }>;
}

export interface EditCommunityPayload {
  id: string;
  name: string;
  description?: string | null;
  communityLink?: string | null;
  cognitoToken?: string | null;
}

function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`;
  return trimmed;
}

export function buildPayload(
  communityData: { name: string; description: string; url: string },
  selectedIds: Set<string>,
): CommunityPayload {
  return {
    name: communityData.name,
    description: communityData.description,
    communityLink: normaliseUrl(communityData.url),
    cellIds: Array.from(selectedIds),
  };
}

export async function postCommunity(payload: CommunityPayload): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/CreateCommunity`, {
    method: "POST",
    headers: {
      ...(await adminHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Database insertion failure");
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

export async function fetchUserCommunities(): Promise<UnifiedCommunityItem[]> {
  const response = await fetch(`${BACKEND_URL}/GetUserCommunities`, {
    method: "GET",
    headers: await adminHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load community details: ${response.statusText}`);
  }

  const data: UserCommunitiesPayload = await response.json();

  const formattedApprovals: UnifiedCommunityItem[] = data.approvals.map(
    (item) => ({
      id: item.id,
      name: item.name,
      description: item.description!,
      communityLink: item.communityLink!,
      status:
        item.status === "amendments_requested"
          ? "amendments_requested"
          : "pending",
      comments: item.comments,
    }),
  );

  const formattedCommunities: UnifiedCommunityItem[] = data.communities.map(
    (item) => ({
      id: item.id,
      name: item.name,
      description: item.description!,
      communityLink: item.communityLink!,
      status: "approved",
    }),
  );

  return [...formattedApprovals, ...formattedCommunities].sort((a, b) => {
    const priority = { amendments_requested: 1, pending: 2, approved: 3 };
    return priority[a.status] - priority[b.status];
  });
}

export async function editCommunity(
  payload: EditCommunityPayload,
): Promise<{ message: string; approval?: UnifiedCommunityItem }> {
  const response = await fetch(`${BACKEND_URL}/EditCommunity`, {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to submit community modifications: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data;
}

export async function deleteCommunity(
  id: string,
  scope: "approval" | "production",
): Promise<{ message: string }> {
  const response = await fetch(`${BACKEND_URL}/DeleteCommunity`, {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify({ id, scope }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete community: ${response.statusText}`);
  }

  return response.json();
}
