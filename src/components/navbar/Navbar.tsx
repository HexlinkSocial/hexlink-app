import { JSX, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import NavMenuCard from "./NavMenuCard";
import HamburgerIcon from "../icons/HamburgerIcon";
import QuestionMarkIcon from "../icons/QuestionMarkIcon";
import { getDocsUrl } from "../../helpers/docsUrl";
import { ExploreNoticePill } from "./ExploreNoticePill";

const DocsButton = (): JSX.Element => {
  const handleDocsClick = (): void => {
    window.open(getDocsUrl("docs/tutorial"), "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      className="docs-btn"
      onClick={handleDocsClick}
      aria-label="Open documentation tutorial"
    >
      <QuestionMarkIcon />
    </button>
  );
};

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
        <ExploreNoticePill text="Tap any tile to explore local communities" />
        <DocsButton />

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
