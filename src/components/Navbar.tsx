import { JSX } from "react";

export default function Navbar(): JSX.Element {
  return (
    <div className="navbar">
      <button
        className="btn btn--primary ml-auto"
        onClick={() => (window.location.href = "/login")}
      >
        Log in
      </button>
    </div>
  );
}
