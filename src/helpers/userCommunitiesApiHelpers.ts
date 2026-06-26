import { adminHeaders } from "./authHeaders";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

export interface UnifiedCommunityItem {
  id: string;
  name: string;
  description: string;
  communityLink: string;
  status: "amendments_requested" | "pending" | "approved";
}

export interface UserCommunitiesPayload {
  approvals: Array<{
    id: string;
    name: string;
    description: string | null;
    communityLink: string | null;
    status: string;
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
