import { JSX, useState } from "react";
import MapContainer from "../components/map/MapContainer";
import Navbar, { MapMode } from "../components/navbar/Navbar";

export default function Home(): JSX.Element {
  const [mode, setMode] = useState<MapMode>("display");

  return (
    <div>
      <Navbar mode={mode} />
      <MapContainer onModeChange={setMode} />
    </div>
  );
}
