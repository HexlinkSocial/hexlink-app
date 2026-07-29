import { JSX, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import NavMenuCard from "./NavMenuCard";

const HamburgerIcon = (): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="20"
    height="20"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export default function Navbar(): JSX.Element {
  const { isLoggedIn, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const toggleMenu = (): void => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = (): void => {
    setIsMenuOpen(false);
  };

  return (
    <div className="navbar">
      <div className="navbar__actions">
        <button
          type="button"
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <HamburgerIcon />
        </button>

        <NavMenuCard
          isOpen={isMenuOpen}
          onClose={closeMenu}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}