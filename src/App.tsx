import React, { JSX } from "react";
import "./styles/App.css";
import "leaflet/dist/leaflet.css";
import Map from "./components/Map";
import Navbar from "./components/Navbar";

export default function App(): JSX.Element {
  return (
    <div>
      <Navbar />
      <Map />
    </div>
  );
}
