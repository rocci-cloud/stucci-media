import { describe, expect, it } from "vitest";
import {
  SUBSCRIBER_SOURCE_LABELS,
  normalizeSubscriberSource,
  subscriberSourceLabel,
} from "../app/lib/subscriber-sources";

// The source is a hidden form field on a public form, so every value that
// reaches these functions is attacker-controlled.
describe("subscriber source validation", () => {
  it("accepts every real capture point", () => {
    for (const key of Object.keys(SUBSCRIBER_SOURCE_LABELS)) {
      expect(normalizeSubscriberSource(key)).toBe(key);
    }
  });

  it("falls back to unknown for anything not on the list", () => {
    expect(normalizeSubscriberSource("some-other-place")).toBe("unknown");
    expect(normalizeSubscriberSource("")).toBe("unknown");
    expect(normalizeSubscriberSource(null)).toBe("unknown");
    expect(normalizeSubscriberSource(undefined)).toBe("unknown");
    expect(normalizeSubscriberSource(42)).toBe("unknown");
    expect(normalizeSubscriberSource({})).toBe("unknown");
  });

  // The bug this pins: validating with `in` walks the prototype chain, so
  // `"toString" in LABELS` is true. The value got stored, and the label
  // lookup then returned Object.prototype.toString — a function — which
  // React cannot render, taking down the admin subscribers page. Any
  // visitor could trigger it from the public newsletter form.
  it.each(["toString", "constructor", "valueOf", "hasOwnProperty", "__proto__", "isPrototypeOf"])(
    "rejects the inherited property %s",
    (key) => {
      expect(normalizeSubscriberSource(key)).toBe("unknown");
    },
  );
});

describe("subscriber source labels", () => {
  it("labels a known source", () => {
    expect(subscriberSourceLabel("modal")).toBe("Newsletter popup");
    expect(subscriberSourceLabel("article")).toBe("Article page");
  });

  it("calls a null source what it is rather than guessing", () => {
    expect(subscriberSourceLabel(null)).toBe("Before tracking");
  });

  // Defence in depth: even a row written by hand or before validation
  // existed has to render as a string.
  it.each(["toString", "constructor", "valueOf", "__proto__"])(
    "returns a string for the inherited property %s",
    (key) => {
      const result = subscriberSourceLabel(key);
      expect(typeof result).toBe("string");
      expect(result).toBe(key);
    },
  );

  it("passes through an unrecognised but harmless value", () => {
    expect(subscriberSourceLabel("legacy-import")).toBe("legacy-import");
  });
});
