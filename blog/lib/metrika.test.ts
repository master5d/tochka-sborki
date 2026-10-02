import { describe, expect, it } from "vitest";
import { buildMetrikaConfig } from "./metrika";

describe("buildMetrikaConfig", () => {
  it("returns null without an id (dark-ship no-op)", () => {
    expect(buildMetrikaConfig(undefined)).toBeNull();
    expect(buildMetrikaConfig("")).toBeNull();
    expect(buildMetrikaConfig("  ")).toBeNull();
  });

  it("rejects a non-numeric id instead of passing NaN to ym", () => {
    expect(buildMetrikaConfig("abc")).toBeNull();
    expect(buildMetrikaConfig("123abc")).toBeNull();
  });

  it("builds a deferred config with webvisor off", () => {
    const cfg = buildMetrikaConfig("113342606");
    expect(cfg).not.toBeNull();
    expect(cfg!.id).toBe(113342606);
    expect(cfg!.options.defer).toBe(true);
    expect(cfg!.options.webvisor).toBe(false);
    expect(cfg!.options.accurateTrackBounce).toBe(true);
  });
});
