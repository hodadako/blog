import { describe, expect, it } from "vitest";
import { getAutoScrollDistance, isScrollKey } from "./auto-scroll";

describe("time-based automatic scroll", () => {
  it.each([30, 60, 120])("moves at the same rate at %i fps", (fps) => {
    const frameDuration = 1000 / fps;
    const distance = Array.from({ length: fps }, () => getAutoScrollDistance(3, frameDuration))
      .reduce((total, frame) => total + frame, 0);
    expect(distance).toBeCloseTo(15, 8);
  });

  it("rejects invalid elapsed time and stops for scroll keys", () => {
    expect(getAutoScrollDistance(3, -1)).toBe(0);
    expect(getAutoScrollDistance(12, 100)).toBe(0);
    expect(isScrollKey("PageDown")).toBe(true);
    expect(isScrollKey(" ")).toBe(true);
    expect(isScrollKey("a")).toBe(false);
  });
});
