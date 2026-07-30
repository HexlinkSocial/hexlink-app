// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMapCore, getNextZoom, getCentre } from "./useMapCore";
import * as geolocationHelpers from "../helpers/geolocation";

const mockMapInstance = {
  addControl: vi.fn(),
  touchZoomRotate: { disableRotation: vi.fn() },
  doubleClickZoom: { disable: vi.fn() },
  on: vi.fn(),
  flyTo: vi.fn(),
  remove: vi.fn(),
};

vi.mock("maplibre-gl", () => {
  class MockMap {
    constructor() {
      return mockMapInstance;
    }
  }

  class MockNavigationControl {}

  return {
    default: {
      Map: MockMap,
      NavigationControl: MockNavigationControl,
    },
    Map: MockMap,
    NavigationControl: MockNavigationControl,
    addProtocol: vi.fn(),
  };
});

vi.mock("pmtiles", () => ({
  Protocol: class {
    tile = vi.fn();
  },
}));

vi.mock("../helpers/geolocation", () => ({
  requestUserLocation: vi.fn(),
}));

describe("useMapCore Helper Utilities", () => {
  describe("getNextZoom", () => {
    it("should correctly bump zoom increments over standard breakpoints", () => {
      expect(getNextZoom(5)).toBe(9.5);
      expect(getNextZoom(10)).toBe(12.5);
      expect(getNextZoom(15)).toBe(14);
    });
  });

  describe("getCentre", () => {
    it("should resolve the geographical average coordinates of a polygon feature", () => {
      const mockFeature = {
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
          ],
        },
      } as any;

      const center = getCentre(mockFeature);
      expect(center).toEqual([4, 4]);
    });
  });
});

describe("useMapCore Hook", () => {
  let containerRef: React.RefObject<HTMLDivElement | null>;

  beforeEach(() => {
    vi.clearAllMocks();
    containerRef = { current: document.createElement("div") };
  });

  it("should return a null instance configuration when no container reference is given", () => {
    const { result } = renderHook(() => useMapCore({ current: null }));
    expect(result.current.map).toBeNull();
    expect(result.current.isMapReady).toBe(false);
  });

  it("should initialize MapLibre constraints and load default controls on mount", () => {
    const { result } = renderHook(() => useMapCore(containerRef));

    expect(result.current.map).toBe(mockMapInstance);
    expect(result.current.map).not.toBeNull();
  });

  it("should track the underlying readiness lifecycle via listener triggers", () => {
    const eventHandlers: Record<string, Function> = {};
    vi.spyOn(mockMapInstance, "on").mockImplementation(
      (event: string, cb: Function) => {
        eventHandlers[event] = cb;
        return mockMapInstance as any;
      },
    );

    const { result } = renderHook(() => useMapCore(containerRef));

    act(() => {
      if (eventHandlers["load"]) {
        eventHandlers["load"]();
      }
    });

    expect(result.current.isMapReady).toBe(true);
  });

  it("should trigger geolocation request on load when initialCamera is omitted", () => {
    const eventHandlers: Record<string, Function> = {};
    vi.spyOn(mockMapInstance, "on").mockImplementation(
      (event: string, cb: Function) => {
        eventHandlers[event] = cb;
        return mockMapInstance as any;
      },
    );

    vi.mocked(geolocationHelpers.requestUserLocation).mockImplementation(
      (onSuccess) => {
        onSuccess([-0.1276, 51.5072]);
      },
    );

    renderHook(() => useMapCore(containerRef));

    act(() => {
      if (eventHandlers["load"]) {
        eventHandlers["load"]();
      }
    });

    expect(geolocationHelpers.requestUserLocation).toHaveBeenCalled();
    expect(mockMapInstance.flyTo).toHaveBeenCalledWith({
      center: [-0.1276, 51.5072],
      zoom: 12,
      essential: true,
    });
  });

  it("should not request user geolocation on load when an explicit initialCamera is supplied", () => {
    const eventHandlers: Record<string, Function> = {};
    vi.spyOn(mockMapInstance, "on").mockImplementation(
      (event: string, cb: Function) => {
        eventHandlers[event] = cb;
        return mockMapInstance as any;
      },
    );

    const initialCamera = {
      center: [2.3522, 48.8566] as maplibregl.LngLatLike,
      zoom: 8,
    };
    renderHook(() => useMapCore(containerRef, initialCamera));

    act(() => {
      if (eventHandlers["load"]) {
        eventHandlers["load"]();
      }
    });

    expect(geolocationHelpers.requestUserLocation).not.toHaveBeenCalled();
    expect(mockMapInstance.flyTo).not.toHaveBeenCalled();
  });

  it("should catch and transform specific engine layer runtime exceptions to strings", () => {
    let errorCallback: Function = () => {};
    vi.spyOn(mockMapInstance, "on").mockImplementation(
      (event: string, cb: Function) => {
        if (event === "error") errorCallback = cb;
        return mockMapInstance as any;
      },
    );

    const { result } = renderHook(() => useMapCore(containerRef));

    act(() => {
      errorCallback({ sourceId: "h3_counts" });
    });

    expect(result.current.error).toBe("Failed to load map data layers.");
  });
});
