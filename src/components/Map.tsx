import React from "react";
import { LatLngBoundsExpression } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import H3Layer from "./H3Layer";

const europeBounds: LatLngBoundsExpression = [
  [34.0, -25.0],
  [72.0, 45.0],
];

export default function Map() {
  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={8}
      scrollWheelZoom={true}
      minZoom={8}
      maxBounds={europeBounds}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <H3Layer />
    </MapContainer>
  );
}
