import { JSX, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Community } from "./types";
import DescriptionBlock from "../DescriptionBlock";
import { useDropdownPosition } from "../../hooks/useDropdownPosition";
import WhatsAppIcon from "../icons/WhatsAppIcon";
import DiscordIcon from "../icons/DiscordIcon";
import FacebookIcon from "../icons/FacebookIcon";
import OtherIcon from "../icons/OtherIcon";
import ArrowIcon from "../icons/ArrowIcon";
import { DisclaimerModal } from "./DisclaimerModal";

interface CommunityItemProps {
  community: Community;
}

const formatCommunityUrl = (url: string | null | undefined): string => {
  if (!url) return "...";

  let cleanUrl = url;

  try {
    const parsed = new URL(url);
    cleanUrl = parsed.host + parsed.pathname;
  } catch {}

  return `${cleanUrl.substring(0, 14)}...`;
};

export default function CommunityItem({
  community,
}: CommunityItemProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingTargetUrl, setPendingTargetUrl] = useState<string | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dropdownCoords = useDropdownPosition(buttonRef, isOpen);

  const links = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      url: community.whatsapp,
      icon: <WhatsAppIcon />,
    },
    {
      key: "discord",
      label: "Discord",
      url: community.discord,
      icon: <DiscordIcon />,
    },
    {
      key: "facebook",
      label: "Facebook",
      url: community.facebook,
      icon: <FacebookIcon />,
    },
    {
      key: "other",
      label: formatCommunityUrl(community.other),
      url: community.other,
      icon: <OtherIcon />,
    },
  ].filter((link) => link.url && link.url.trim() !== "");

  const hasLinks = links.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsOpen(false);
        }
      },
      {
        threshold: 0,
      },
    );

    observer.observe(buttonRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
  ): void => {
    e.preventDefault();
    setIsOpen(false);
    setPendingTargetUrl(url);
  };

  const confirmExternalNavigation = (): void => {
    if (pendingTargetUrl) {
      window.open(pendingTargetUrl, "_blank", "noopener,noreferrer");
    }
    setPendingTargetUrl(null);
  };

  return (
    <div className="community-item">
      <div className="community-item__info">
        <span className="community-item__name">{community.name}</span>
        {community.description !== null && (
          <DescriptionBlock
            description={community.description}
            maxLength={90}
            baseClassName="community-item"
          />
        )}
      </div>
      <div className="community-item__action-container">
        {hasLinks ? (
          <button
            ref={buttonRef}
            className={`community-item__join ${isOpen ? "community-item__join--active" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            Join
            <ArrowIcon />
          </button>
        ) : (
          <button
            className="community-item__join community-item__join--disabled"
            disabled
          >
            Join
          </button>
        )}

        {isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              className="community-item__dropdown"
              style={{
                position: "absolute",
                top: `${dropdownCoords.top + 6}px`,
                left: `${dropdownCoords.left + dropdownCoords.width - 140}px`,
              }}
            >
              {links.map((link) => (
                <a
                  key={link.key}
                  href={link.url ?? "#"}
                  className="community-item__dropdown-link"
                  onClick={(e) => handleLinkClick(e, link.url ?? "#")}
                >
                  <span className="community-item__dropdown-icon">
                    {link.icon}
                  </span>
                  {link.label}
                </a>
              ))}
            </div>,
            document.body,
          )}

        <DisclaimerModal
          isOpen={pendingTargetUrl !== null}
          onCancel={() => setPendingTargetUrl(null)}
          onConfirm={confirmExternalNavigation}
        />
      </div>
    </div>
  );
}
