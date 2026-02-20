import React, { JSX } from "react";
import "./styles/App.css";
import "leaflet/dist/leaflet.css";
import Map from "./components/Map";

export default function App(): JSX.Element {
  return <Map />;
}
