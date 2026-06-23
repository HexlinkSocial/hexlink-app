import { JSX } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Navbar(): JSX.Element {
  const { isLoggedIn, isAdmin } = useAuth();

  return (
    <div className="navbar">
      <div
        className="ml-auto flex items-center gap-4"
        style={{ display: "flex", marginLeft: "auto", gap: "1rem" }}
      >
        {isAdmin && (
          <button
            className="btn btn--primary"
            onClick={() => (window.location.href = "/admin")}
          >
            Admin
          </button>
        )}

        <button
          className="btn btn--primary"
          onClick={() => (window.location.href = "/login")}
        >
          {isLoggedIn ? "Manage" : "Log in"}
        </button>
      </div>
    </div>
  );
}
