import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "@/lib/nav";

describe("NAV_ITEMS", () => {
  it("every item has a route, label and phase", () => {
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.phase.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate routes", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
