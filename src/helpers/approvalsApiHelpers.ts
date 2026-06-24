const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

export interface ApprovalItem {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  communityLink: string | null;
  cellIds: string[];
  status: string;
  comments: string | null;
  createdAt: string;
}

export type ApprovalAction = "approve" | "reject" | "amend";

function adminHeaders(
  isAdmin: boolean,
  token?: string,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(token != null ? { Authorization: `Bearer ${token}` } : {}),
    ...(isAdmin ? { "X-Mock-Groups": "Admins" } : {}),
  };
}

export async function fetchApprovals(
  isAdmin: boolean,
  token?: string,
): Promise<ApprovalItem[]> {
  const res = await fetch(`${BACKEND_URL}/GetPendingCommunities`, {
    method: "POST",
    headers: adminHeaders(isAdmin, token),
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ApprovalItem[];
}

export async function submitAction(
  isAdmin: boolean,
  id: string,
  action: ApprovalAction,
  comments?: string,
  token?: string,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/ApproveOrDenyCommunity`, {
    method: "POST",
    headers: adminHeaders(isAdmin, token),
    body: JSON.stringify({ id, action, comments }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
