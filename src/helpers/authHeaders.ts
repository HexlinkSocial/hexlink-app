import { fetchAuthSession } from "aws-amplify/auth";

export async function adminHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString() as string;
  return {
    "Content-Type": "application/json",
    ...(token != null ? { Authorization: `Bearer ${token}` } : {}),
  };
}
