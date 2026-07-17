import { adminHeaders } from "./authHeaders";

function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL ?? "";
}

export interface ApprovalItem {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  ownerEmail: string;
  cellIds: string[];
  status: string;
  comments: string | null;
  createdAt: string;
  lastEdited: string;
  whatsapp?: string | null;
  discord?: string | null;
  facebook?: string | null;
  other?: string | null;
}

export type ApprovalAction = "approve" | "reject" | "amend";

export async function fetchApprovals(): Promise<ApprovalItem[]> {
  const res = await fetch(`${getBackendUrl()}/GetPendingCommunities`, {
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
  const res = await fetch(`${getBackendUrl()}/ApproveOrDenyCommunity`, {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify({ id, action, comments }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
