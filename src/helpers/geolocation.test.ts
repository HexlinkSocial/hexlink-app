// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestUserLocation } from "./geolocation";

describe("requestUserLocation", () => {
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
      writable: true,
    });
  });

  it("should invoke onSuccess with coordinates when geolocation is granted", () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          longitude: -0.1276,
          latitude: 51.5072,
        },
      });
    });

    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    requestUserLocation(onSuccess, onError);

    expect(mockGetCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
    expect(onSuccess).toHaveBeenCalledWith([-0.1276, 51.5072]);
    expect(onError).not.toHaveBeenCalled();
  });

  it("should invoke onError when geolocation request fails", () => {
    const mockError = new Error(
      "User denied Geolocation",
    ) as unknown as GeolocationPositionError;

    const mockGetCurrentPosition = vi.fn((_, errorCallback) => {
      errorCallback(mockError);
    });

    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    requestUserLocation(onSuccess, onError);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it("should safely return without invoking callbacks if geolocation API is unavailable", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    requestUserLocation(onSuccess, onError);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
