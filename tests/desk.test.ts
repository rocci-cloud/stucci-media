import { describe, expect, it } from "vitest";
import vm from "node:vm";
import {
  DESK_ATTRIBUTE,
  DESK_INIT_SCRIPT,
  DESK_STORAGE_KEY,
  deskForHour,
  floridaHour,
  resolveDesk,
} from "../app/lib/desk";

describe("deskForHour", () => {
  it("runs the night desk from 6pm to 5:59am", () => {
    expect(deskForHour(18)).toBe("night");
    expect(deskForHour(23)).toBe("night");
    expect(deskForHour(0)).toBe("night");
    expect(deskForHour(5)).toBe("night");
  });

  it("runs the day desk from 6am to 5:59pm", () => {
    expect(deskForHour(6)).toBe("day");
    expect(deskForHour(12)).toBe("day");
    expect(deskForHour(17)).toBe("day");
  });

  it("switches on exactly the boundary hours, not around them", () => {
    expect(deskForHour(17)).toBe("day");
    expect(deskForHour(18)).toBe("night");
    expect(deskForHour(5)).toBe("night");
    expect(deskForHour(6)).toBe("day");
  });
});

describe("resolveDesk", () => {
  it("lets a stored choice beat the clock in both directions", () => {
    expect(resolveDesk("day", 23)).toBe("day");
    expect(resolveDesk("night", 12)).toBe("night");
  });

  it("falls back to the hour for anything that is not a real choice", () => {
    for (const stored of [null, undefined, "", "dark", "DAY", 1, {}]) {
      expect(resolveDesk(stored, 23)).toBe("night");
      expect(resolveDesk(stored, 12)).toBe("day");
    }
  });
});

describe("floridaHour", () => {
  // The whole point of the feature is that it follows the newsroom's clock,
  // not the reader's. These are the same instant read from two zones.
  it("reads Florida's hour regardless of the runtime's own timezone", () => {
    // 2026-01-15T23:30:00Z is 6:30pm in Florida (EST, UTC-5).
    expect(floridaHour(new Date("2026-01-15T23:30:00Z"))).toBe(18);
    // 2026-07-15T23:30:00Z is 7:30pm in Florida (EDT, UTC-4) — the same
    // UTC hour, an hour later locally, which is what DST handling means.
    expect(floridaHour(new Date("2026-07-15T23:30:00Z"))).toBe(19);
  });

  it("reports midnight as 0, not 24", () => {
    // 05:30Z in January is 00:30 in Florida.
    expect(floridaHour(new Date("2026-01-15T05:30:00Z"))).toBe(0);
  });
});

// The inline script cannot import, so it restates the rules above. These
// run the real script text against a fake document and pin the two
// implementations to each other — the failure mode otherwise is silent:
// the script keeps setting the old answer while the module returns the new
// one, and nothing in the app compares them.
function runInitScript(options: {
  stored?: string | null;
  pathname?: string;
  hour?: number;
  throwOnStorage?: boolean;
}) {
  const attributes = new Map<string, string>();
  const context = {
    location: { pathname: options.pathname ?? "/" },
    localStorage: {
      getItem(key: string) {
        if (options.throwOnStorage) throw new Error("storage disabled");
        return key === DESK_STORAGE_KEY ? (options.stored ?? null) : null;
      },
    },
    document: {
      documentElement: {
        setAttribute: (name: string, value: string) => attributes.set(name, value),
      },
    },
    Date,
    Intl:
      options.hour === undefined
        ? Intl
        : ({
            DateTimeFormat: class {
              format() {
                return String(options.hour);
              }
            },
          } as unknown as typeof Intl),
  };
  vm.createContext(context);
  vm.runInContext(DESK_INIT_SCRIPT, context);
  return attributes.get(DESK_ATTRIBUTE) ?? null;
}

describe("DESK_INIT_SCRIPT", () => {
  it("agrees with deskForHour at every hour of the day", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      expect(runInitScript({ hour })).toBe(deskForHour(hour));
    }
  });

  it("agrees with resolveDesk when a choice is stored", () => {
    expect(runInitScript({ stored: "day", hour: 23 })).toBe(resolveDesk("day", 23));
    expect(runInitScript({ stored: "night", hour: 12 })).toBe(resolveDesk("night", 12));
    expect(runInitScript({ stored: "garbage", hour: 12 })).toBe(resolveDesk("garbage", 12));
  });

  it("leaves the admin dashboard alone", () => {
    // The admin owns its own theme via next-themes and the `dark` class.
    // Stamping a night desk there would give a light dashboard dark
    // scrollbars and dark native form controls.
    expect(runInitScript({ pathname: "/admin", hour: 23 })).toBeNull();
    expect(runInitScript({ pathname: "/admin/articles", hour: 23 })).toBeNull();
    expect(runInitScript({ pathname: "/", hour: 23 })).toBe("night");
  });

  it("falls back to the day desk when storage throws", () => {
    // Private browsing and hardened settings both throw on localStorage
    // access rather than returning null. An uncaught throw here would
    // leave the page with no desk attribute at all.
    expect(runInitScript({ throwOnStorage: true, hour: 23 })).toBe("day");
  });
});
