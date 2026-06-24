import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession, AuthUser } from "aws-amplify/auth";
import { useEffect, useState } from "react";

export interface UseAuthResult {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  user: AuthUser | undefined;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => void;
}

export function useAuth(): UseAuthResult {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isLoggedIn = user != null;

  useEffect(() => {
    async function checkAdminGroup(): Promise<void> {
      if (user == null) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload?.["cognito:groups"];
        const hasAdminGroup = Array.isArray(groups)
          ? groups.includes("Admins")
          : typeof groups === "string"
            ? groups.split(",").includes("Admins")
            : false;
        setIsAdmin(hasAdminGroup);
      } catch (error) {
        console.error("Error fetching auth session groups:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    void checkAdminGroup();
  }, [user]);

  return { user, isLoggedIn, isAdmin, isLoading, signOut };
}
