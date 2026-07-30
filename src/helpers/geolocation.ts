import * as maplibregl from "maplibre-gl";

export function requestUserLocation(
  onSuccess: (center: maplibregl.LngLatLike) => void,
  onError?: (error: GeolocationPositionError) => void,
): void {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess([position.coords.longitude, position.coords.latitude]);
    },
    (err) => {
      onError?.(err);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    },
  );
}
