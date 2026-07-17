// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMapBuilder } from "./useMapBuilder";
import { useMapCore } from "./useMapCore";

vi.mock("./useMapCore", () => ({
  useMapCore: vi.fn(),
}));

vi.mock("h3-js", () => ({
  gridDisk: vi.fn().mockReturnValue(["neighbor-1"]),
}));

describe("useMapBuilder", () => {
  let mockMap: any;
  const containerRef = { current: document.createElement("div") };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMap = {
      setMinZoom: vi.fn(),
      getLayer: vi.fn().mockReturnValue(null),
      getSource: vi.fn().mockReturnValue({}),
      addLayer: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      setPaintProperty: vi.fn(),
    };
  });

  it("should establish constraints like minZoom and add auxiliary visual layers on ready", () => {
    vi.mocked(useMapCore).mockReturnValue({
      map: mockMap,
      isMapReady: true,
      error: null,
    });

    const { result } = renderHook(() => useMapBuilder(containerRef));

    expect(mockMap.setMinZoom).toHaveBeenCalledWith(12);
    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "h3-grid-dynamic-outline" }),
      "h3-grid-fill"
    );
    expect(result.current.selectedIds).toEqual(new Set());
  });

  it("should paint default grid colors when selection list is empty", () => {
    vi.mocked(useMapCore).mockReturnValue({
      map: mockMap,
      isMapReady: true,
      error: null,
    });

    renderHook(() => useMapBuilder(containerRef));

    expect(mockMap.setPaintProperty).toHaveBeenCalledWith(
      "h3-grid-fill",
      "fill-color",
      expect.any(Array)
    );
  });
});