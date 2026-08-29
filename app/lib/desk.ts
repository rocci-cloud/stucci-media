// The public site's day/night theme ("desk", as in a newsroom's night desk).
//
// Deliberately NOT next-themes and deliberately NOT the `dark` class. The
// admin dashboard already mounts next-themes and owns `.dark` on <html>
// (see the long note in globals.css about Radix portals). Reusing either
// here would mean a reader's night mode repainted the admin, and an
// admin's dark mode leaked onto the public site. This is a separate
// attribute, `data-desk`, on the same element, with its own storage key.
//
// The default is time-of-day in Florida, not the visitor's OS setting:
// this is one newsroom in one place, and the site should look like that
// newsroom at that hour. A visitor's explicit choice always wins and is
// remembered.

export type Desk = "day" | "night";

export const DESK_ATTRIBUTE = "data-desk";
export const DESK_STORAGE_KEY = "sm-desk";
export const DESK_TIMEZONE = "America/New_York";

/** Night desk runs 6pm through 5:59am, Florida time. */
export const NIGHT_STARTS_HOUR = 18;
export const NIGHT_ENDS_HOUR = 6;

export function deskForHour(hour: number): Desk {
  return hour >= NIGHT_STARTS_HOUR || hour < NIGHT_ENDS_HOUR ? "night" : "day";
}

export function isDesk(value: unknown): value is Desk {
  return value === "day" || value === "night";
}

/**
 * A stored preference always beats the clock — someone who picked light at
 * 9pm meant it. Anything else (never chosen, cleared, or corrupted storage)
 * falls through to the hour.
 */
export function resolveDesk(stored: unknown, hour: number): Desk {
  return isDesk(stored) ? stored : deskForHour(hour);
}

/** The hour in Florida right now, regardless of where the reader is. */
export function floridaHour(now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: DESK_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).format(now);
  // hour12:false yields "24" rather than "0" at midnight in some engines.
  return Number(hour) % 24;
}

/**
 * Runs before first paint, inlined in <body>. It cannot import anything, so
 * the rule above is restated here — the tests pin both against each other.
 *
 * Resolving this on the client is not a style preference, it is a
 * correctness requirement: the homepage is ISR-cached (`revalidate = 60`)
 * and served from Vercel's edge, so HTML rendered at 5:59pm is handed to
 * readers well after the night desk should have started. Any server-side
 * decision here would be cached and wrong.
 */
export const DESK_INIT_SCRIPT = `(function(){try{
// The admin dashboard has its own theme (next-themes, the \`dark\` class).
// Setting data-desk there would put a night \`color-scheme\` on a light
// dashboard, giving it dark scrollbars and dark native form controls while
// every pixel the admin components draw stays light.
if(location.pathname.indexOf("/admin")===0){return;}
var k=${JSON.stringify(DESK_STORAGE_KEY)};
var s=localStorage.getItem(k);
var d=(s==="day"||s==="night")?s:null;
if(!d){
var h=Number(new Intl.DateTimeFormat("en-US",{timeZone:${JSON.stringify(DESK_TIMEZONE)},hour:"numeric",hour12:false}).format(new Date()))%24;
d=(h>=${NIGHT_STARTS_HOUR}||h<${NIGHT_ENDS_HOUR})?"night":"day";
}
document.documentElement.setAttribute(${JSON.stringify(DESK_ATTRIBUTE)},d);
}catch(e){document.documentElement.setAttribute(${JSON.stringify(DESK_ATTRIBUTE)},"day");}})();`;
