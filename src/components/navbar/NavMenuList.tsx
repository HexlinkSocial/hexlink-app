import { JSX } from "react";

export interface NavMenuItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface NavMenuListProps {
  items: NavMenuItem[];
  onItemClick: () => void;
}

export default function NavMenuList({
  items,
  onItemClick,
}: NavMenuListProps): JSX.Element {
  return (
    <ul className="nav-menu-card__list">
      {items.map((item) => (
        <li key={item.href} className="nav-menu-card__item">
          <a
            className="nav-menu-card__link"
            href={item.href}
            target={item.isExternal ? "_blank" : undefined}
            rel={item.isExternal ? "noopener noreferrer" : undefined}
            onClick={onItemClick}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
