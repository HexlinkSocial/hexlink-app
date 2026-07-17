// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMap } from "./useMap";
import { useMapCore } from "./useMapCore";

vi.mock("./useMapCore", () => ({
  useMapCore: vi.fn(),
  getCentre: vi.fn().mockReturnValue([0, 0]),
  flyToFeature: vi.fn(),
}));

describe("useMap", () => {
  let mockMap: any;
  const containerRef = { current: document.createElement("div") };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMap = {
      on: vi.fn(),
      getZoom: vi.fn().mockReturnValue(10),
      flyTo: vi.fn(),
    };
  });

  it("should return status of core map layout layers on setup", () => {
    vi.mocked(useMapCore).mockReturnValue({
      map: mockMap,
      isMapReady: true,
      error: null,
    });

    const { result } = renderHook(() => useMap(containerRef));

    expect(result.current.map).toBe(mockMap);
    expect(result.current.isMapReady).toBe(true);
    expect(result.current.selectedCellId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should attach drag, zoom, and layer click listeners once map is ready", () => {
    vi.mocked(useMapCore).mockReturnValue({
      map: mockMap,
      isMapReady: true,
      error: null,
    });

    renderHook(() => useMap(containerRef));

    expect(mockMap.on).toHaveBeenCalledWith("dragstart", expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith("zoomstart", expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith("click", "h3-counts-r4", expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith("click", "h3-grid-fill", expect.any(Function));
  });
});