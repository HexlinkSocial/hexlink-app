import { JSX } from "react";
import MapContainer from "../components/map/MapContainer";
import Navbar from "../components/navbar/Navbar";

export default function Home(): JSX.Element {
  return (
    <div>
      <Navbar />
      <MapContainer />
    </div>
  );
}
