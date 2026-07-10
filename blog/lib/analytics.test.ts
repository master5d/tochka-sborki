import { describe, expect, it } from "vitest";
import { buildAnalyticsConfig } from "./analytics";

describe("buildAnalyticsConfig", () => {
  it("returns null without a key (dark-ship no-op)", () => {
    expect(buildAnalyticsConfig(undefined)).toBeNull();
    expect(buildAnalyticsConfig("")).toBeNull();
  });

  it("returns a cookieless privacy-friendly config with a key", () => {
    const cfg = buildAnalyticsConfig("phc_test");
    expect(cfg).not.toBeNull();
    expect(cfg!.key).toBe("phc_test");
    expect(cfg!.apiHost).toBe("https://us.i.posthog.com");
    expect(cfg!.options.persistence).toBe("memory");
    expect(cfg!.options.respect_dnt).toBe(true);
    expect(cfg!.options.autocapture).toBe(false);
    expect(cfg!.options.capture_pageview).toBe(false);
  });

  it("honors a custom host", () => {
    expect(buildAnalyticsConfig("phc_x", "https://eu.i.posthog.com")!.apiHost).toBe("https://eu.i.posthog.com");
  });
});
