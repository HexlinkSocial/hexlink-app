import { useAuthenticator } from "@aws-amplify/ui-react";
import { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);

  if (authStatus === "configuring") {
    return <div className="communities-card__spinner" />;
  }

  if (user === undefined) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
