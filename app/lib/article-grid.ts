/**
 * The one column rule every homepage article grid uses.
 *
 * It lives here rather than being retyped in each module because that is
 * exactly how the homepage drifted into three different column counts:
 * the mosaic ran a 60/40 lead plus a four-up rail, the personalized rail
 * ran 58/42, and only the category bands were three across. A single
 * exported string means a future module cannot quietly invent a fourth
 * arrangement.
 *
 * Breakpoints are explicit pixel values rather than Tailwind's `sm`/`lg`:
 * `sm` is 640, which put a second column on a large phone, and `lg` is
 * 1024, which squeezes a third column under ~320px — right where a
 * three-line headline clamp starts wrapping badly.
 */
export const ARTICLE_GRID =
  "grid grid-cols-1 gap-x-4 gap-y-6 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3";
