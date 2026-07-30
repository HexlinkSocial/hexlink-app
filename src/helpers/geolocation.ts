import * as maplibregl from "maplibre-gl";

export function requestUserLocation(
  onSuccess: (center: maplibregl.LngLatLike) => void,
  onError?: (error: GeolocationPositionError) => void,
): void {
  // Check that navigator and navigator.geolocation actually exist
  if (typeof window === "undefined" || !navigator?.geolocation) {
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
