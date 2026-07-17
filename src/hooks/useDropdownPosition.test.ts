// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDropdownPosition } from "./useDropdownPosition";

describe("useDropdownPosition", () => {
  let buttonEl: HTMLButtonElement;
  let scrollContainerEl: HTMLDivElement;

  beforeEach(() => {
    buttonEl = document.createElement("button");
    scrollContainerEl = document.createElement("div");
    scrollContainerEl.className = "communities-card__body";
    scrollContainerEl.appendChild(buttonEl);
    document.body.appendChild(scrollContainerEl);

    buttonEl.getBoundingClientRect = vi.fn().mockReturnValue({
      bottom: 150,
      left: 50,
      width: 200,
      top: 100,
      right: 250,
      height: 50,
    });

    window.scrollY = 10;
    window.scrollX = 5;
  });

  afterEach(() => {
    document.body.removeChild(scrollContainerEl);
  });

  it("should not compute coords when isOpen is false", () => {
    const buttonRef = { current: buttonEl };
    const { result } = renderHook(() => useDropdownPosition(buttonRef, false));

    expect(result.current).toEqual({ top: 0, left: 0, width: 0 });
  });

  it("should compute absolute page coordinates when opened", () => {
    const buttonRef = { current: buttonEl };
    const { result } = renderHook(() => useDropdownPosition(buttonRef, true));

    expect(result.current).toEqual({
      top: 160, // bottom (150) + scrollY (10)
      left: 55, // left (50) + scrollX (5)
      width: 200,
    });
  });

  it("should recalculate coordinates on window resize", () => {
    const buttonRef = { current: buttonEl };
    const { result } = renderHook(() => useDropdownPosition(buttonRef, true));

    buttonEl.getBoundingClientRect = vi.fn().mockReturnValue({
      bottom: 180,
      left: 60,
      width: 210,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toEqual({
      top: 190, // bottom (180) + scrollY (10)
      left: 65,  // left (60) + scrollX (5)
      width: 210,
    });
  });

  it("should recalculate coordinates on scrolling container", () => {
    const buttonRef = { current: buttonEl };
    const { result } = renderHook(() => useDropdownPosition(buttonRef, true));

    buttonEl.getBoundingClientRect = vi.fn().mockReturnValue({
      bottom: 140,
      left: 50,
      width: 200,
    });

    act(() => {
      scrollContainerEl.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toEqual({
      top: 150,
      left: 55,
      width: 200,
    });
  });
});