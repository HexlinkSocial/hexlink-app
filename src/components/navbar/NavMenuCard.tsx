import { JSX } from "react";
import NavMenuList, { NavMenuItem } from "./NavMenuList";

interface NavMenuCardProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

const CloseIcon = (): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function getNavigationItems(
  isLoggedIn: boolean,
  isAdmin: boolean,
): NavMenuItem[] {
  const items: NavMenuItem[] = [
    {
      label: "Tips and Docs",
      href: "https://docs.hexlink.org",
      isExternal: true,
    },
  ];

  if (isAdmin) {
    items.push({
      label: "Admin",
      href: "/admin",
    });
  }

  items.push({
    label: isLoggedIn ? "Manage" : "Log in to manage your community",
    href: "/login",
  });

  return items;
}

export default function NavMenuCard({
  isOpen,
  onClose,
  isLoggedIn,
  isAdmin,
}: NavMenuCardProps): JSX.Element {
  const menuItems = getNavigationItems(isLoggedIn, isAdmin);

  return (
    <>
      <button
        type="button"
        className={`nav-menu-backdrop ${isOpen ? "nav-menu-backdrop--open" : ""}`}
        onClick={onClose}
        aria-label="Close menu backdrop"
      />

      <div
        className={`nav-menu-card ${isOpen ? "nav-menu-card--open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="nav-menu-card__header">
          <span className="nav-menu-card__title">Menu</span>
          <button
            type="button"
            className="nav-menu-card__close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="nav-menu-card__body">
          <NavMenuList items={menuItems} onItemClick={onClose} />
        </div>
      </div>
    </>
  );
}