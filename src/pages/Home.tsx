import { JSX } from "react";
import Map from "../components/Map";
import Navbar from "../components/Navbar";

export default function Home(): JSX.Element {
  return (
    <div>
      <Navbar />
      <Map />
    </div>
  );
}
