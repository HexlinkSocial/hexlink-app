import { JSX } from "react";
import "../styles/Navbar.css";

export default function Navbar(): JSX.Element {
  return (
    <div className="navbar">
      <button
        className="button right"
        onClick={() => (window.location.href = "/login")}
      >
        Log in
      </button>
    </div>
  );
}
