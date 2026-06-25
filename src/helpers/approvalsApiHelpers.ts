import { adminHeaders } from "./authHeaders";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

export interface ApprovalItem {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  ownerEmail: string;
  communityLink: string | null;
  cellIds: string[];
  status: string;
  comments: string | null;
  createdAt: string;
}

export type ApprovalAction = "approve" | "reject" | "amend";

export async function fetchApprovals(): Promise<ApprovalItem[]> {
  const res = await fetch(`${BACKEND_URL}/GetPendingCommunities`, {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ApprovalItem[];
}

export async function submitAction(
  id: string,
  action: ApprovalAction,
  comments?: string,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/ApproveOrDenyCommunity`, {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify({ id, action, comments }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
