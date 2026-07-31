import { JSX, useEffect, useState } from "react";
import MapContainer from "../components/map/MapContainer";
import Navbar, { MapMode } from "../components/navbar/Navbar";
import TutorialModal from "../components/tutorial/TutorialModal";

const TUTORIAL_SEEN_KEY = "has_seen_tutorial";

function checkHasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

function markTutorialAsSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  } catch {
    // Ignore storage quota or access errors
  }
}

export default function Home(): JSX.Element {
  const [mode, setMode] = useState<MapMode>("display");
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!checkHasSeenTutorial()) {
      setIsTutorialOpen(true);
    }
  }, []);

  const handleCloseTutorial = (): void => {
    markTutorialAsSeen();
    setIsTutorialOpen(false);
  };

  return (
    <div>
      <Navbar mode={mode} />
      <MapContainer onModeChange={setMode} />
      <TutorialModal isOpen={isTutorialOpen} onClose={handleCloseTutorial} />
    </div>
  );
}
