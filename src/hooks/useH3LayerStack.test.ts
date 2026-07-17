// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useH3LayerStack } from "./useH3LayerStack";

describe("useH3LayerStack", () => {
  let mockMap: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMap = {
      getZoom: vi.fn(),
      queryRenderedFeatures: vi.fn(),
      setFilter: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };
  });

  it("should not bind events or set filters when map is not ready", () => {
    renderHook(() => useH3LayerStack(null, false));
    expect(mockMap.on).not.toHaveBeenCalled();

    renderHook(() => useH3LayerStack(mockMap, false));
    expect(mockMap.on).not.toHaveBeenCalled();
  });

  it("should subscribe to move and sourcedata map events upon mounting", () => {
    mockMap.getZoom.mockReturnValue(5);

    renderHook(() => useH3LayerStack(mockMap, true));

    expect(mockMap.on).toHaveBeenCalledWith("move", expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith("sourcedata", expect.any(Function));
  });

  it("should clear the filter when no zoom-based target layers match", () => {
    mockMap.getZoom.mockReturnValue(30);

    renderHook(() => useH3LayerStack(mockMap, true));

    expect(mockMap.setFilter).toHaveBeenCalledWith("h3-grid-fill", null);
  });

  it("should query layers and apply correct match filter layout options", () => {
    mockMap.getZoom.mockReturnValue(9);
    mockMap.queryRenderedFeatures.mockReturnValue([
      { properties: { cell_id: "841f185ffffffff" } },
      { properties: { cell_id: "841f185ffffffff" } },
      { properties: { cell_id: "841f187ffffffff" } },
    ]);

    renderHook(() => useH3LayerStack(mockMap, true));

    expect(mockMap.queryRenderedFeatures).toHaveBeenCalledWith({
      layers: ["h3-counts-r4", "h3-counts-r6"],
    });

    expect(mockMap.setFilter).toHaveBeenCalledWith("h3-grid-fill", [
      "match",
      ["string", ["get", "h3"]],
      ["841f185ffffffff", "841f187ffffffff"],
      false,
      true,
    ]);
  });

  it("should cleanly detach registered callbacks on unmount", () => {
    mockMap.getZoom.mockReturnValue(5);

    const { unmount } = renderHook(() => useH3LayerStack(mockMap, true));
    unmount();

    expect(mockMap.off).toHaveBeenCalledWith("move", expect.any(Function));
    expect(mockMap.off).toHaveBeenCalledWith("sourcedata", expect.any(Function));
  });
});