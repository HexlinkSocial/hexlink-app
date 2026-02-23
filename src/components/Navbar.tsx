import { JSX } from "react";
import "../styles/Navbar.css";

export default function Navbar(): JSX.Element {
  return (
    <div className="navbar">
      <button className="button right">Log in</button>
    </div>
  );
}
