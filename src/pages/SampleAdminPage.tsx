import { useAuthenticator } from "@aws-amplify/ui-react";
import { JSX } from "react";

export default function SampleAdminPage(): JSX.Element {
  const { user, signOut } = useAuthenticator();

  return (
    <div>
      Sample Admin Page - signed in as {user?.username}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
