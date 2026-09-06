/**
 * The thesis, drawn.
 *
 * Two road cross-sections side by side: a failed flat profile where water
 * channels down the tire tracks, and a corrected crown where it sheds off both
 * shoulders. This is the single clearest expression of what the business
 * sells, and no competitor in this market draws it.
 *
 * Pure SVG — no library, no animation dependency. Colors come from the theme
 * tokens so the drawing stays consistent with the rest of the page.
 */
export function CrossSection({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <div className="overflow-x-auto border border-rule bg-surface p-5 sm:p-7">
        <svg
          viewBox="0 0 640 250"
          className="block h-auto w-full min-w-[460px]"
          role="img"
          aria-label="Two gravel driveway cross-sections. On the left, a failed flat profile where water channels down the tire tracks and deepens them. On the right, a corrected crowned profile where water sheds off both shoulders into ditches."
        >
          {/* ── Failed profile ── */}
          <text x="8" y="18" fill="#a3a3a0" fontFamily="ui-monospace, monospace" fontSize="10.5" letterSpacing="1.4">
            FAILED · CROWN LOST
          </text>
          <path d="M8 150 L292 150 L292 196 L8 196 Z" fill="#242424" />
          <path
            d="M8 150 L52 150 Q78 150 84 160 Q92 172 104 172 Q118 172 124 160 Q130 150 156 150 L164 150 Q190 150 196 160 Q202 172 216 172 Q228 172 236 160 Q242 150 268 150 L292 150 L292 158 L8 158 Z"
            fill="#4a4a47"
          />
          <path d="M88 165 Q96 174 104 174 Q113 174 120 165 Q104 170 88 165 Z" fill="#5b7fa8" />
          <path d="M200 165 Q208 174 216 174 Q225 174 232 165 Q216 170 200 165 Z" fill="#5b7fa8" />
          <path d="M104 96 L104 156" stroke="#5b7fa8" strokeWidth="2.5" fill="none" />
          <path d="M104 162 L99 150 L109 150 Z" fill="#5b7fa8" />
          <path d="M216 96 L216 156" stroke="#5b7fa8" strokeWidth="2.5" fill="none" />
          <path d="M216 162 L211 150 L221 150 Z" fill="#5b7fa8" />
          <text x="150" y="80" fill="#ee7566" fontFamily="ui-monospace, monospace" fontSize="10.5" textAnchor="middle">
            water follows the tire tracks
          </text>
          <text x="150" y="222" fill="#a3a3a0" fontFamily="ui-monospace, monospace" fontSize="10" textAnchor="middle">
            ruts deepen · fines wash out · base softens
          </text>

          <path d="M320 40 L320 210" stroke="#2e2e2c" strokeWidth="1" fill="none" />

          {/* ── Corrected profile ── */}
          <text x="348" y="18" fill="#ffd700" fontFamily="ui-monospace, monospace" fontSize="10.5" letterSpacing="1.4">
            CORRECTED · CROWN RESTORED
          </text>
          <path d="M348 150 L632 150 L632 196 L348 196 Z" fill="#242424" />
          <path d="M348 156 Q490 124 632 156 L632 164 Q490 133 348 164 Z" fill="#ffd700" />
          <path d="M490 108 L490 130" stroke="#4a4a47" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          <text x="490" y="102" fill="#a3a3a0" fontFamily="ui-monospace, monospace" fontSize="9.5" textAnchor="middle">
            crown
          </text>
          <path d="M470 84 L470 122" stroke="#5b7fa8" strokeWidth="2.5" fill="none" />
          <path d="M470 128 L465 116 L475 116 Z" fill="#5b7fa8" />
          <path d="M446 140 Q404 146 372 168" stroke="#5b7fa8" strokeWidth="2.5" fill="none" />
          <path d="M368 172 L374 160 L380 168 Z" fill="#5b7fa8" />
          <path d="M534 140 Q576 146 608 168" stroke="#5b7fa8" strokeWidth="2.5" fill="none" />
          <path d="M612 172 L600 168 L606 160 Z" fill="#5b7fa8" />
          <path d="M348 176 Q360 190 372 176" stroke="#5b7fa8" strokeWidth="1.5" fill="none" />
          <path d="M608 176 Q620 190 632 176" stroke="#5b7fa8" strokeWidth="1.5" fill="none" />
          <text x="490" y="222" fill="#a3a3a0" fontFamily="ui-monospace, monospace" fontSize="10" textAnchor="middle">
            water leaves the surface · ditch carries it away
          </text>
        </svg>
      </div>
      <figcaption className="measure mt-4 font-mono text-xs leading-relaxed text-muted">
        The same driveway, two shapes. Crown, cross-slope, and where the water exits decide whether a
        repair lasts a season or a decade.
      </figcaption>
    </figure>
  );
}
