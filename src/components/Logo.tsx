/* SILAAI STUDIO brand mark — rebuilt as crisp, theme-aware SVG.
   The stitched double ring holds the Devanagari सिलाई; the `full`
   variant adds the SILAAI / STUDIO wordmark below. Uses currentColor
   so it inverts cleanly between light and dark. */
export function Logo({ variant = "mark", size = 34, className }: { variant?: "mark" | "full"; size?: number; className?: string }) {
  const w = variant === "full" ? size * 1.7 : size;
  const h = variant === "full" ? size * 2.15 : size;
  return (
    <svg className={className} width={w} height={h} viewBox={variant === "full" ? "0 0 170 215" : "0 0 100 100"}
      fill="none" role="img" aria-label="Silaai Studio">
      <g transform={variant === "full" ? "translate(35 0)" : ""}>
        {/* solid outer ring */}
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" />
        {/* dashed stitching ring */}
        <circle cx="50" cy="50" r="37.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.2 3.4" opacity="0.9" />
        {/* सिलाई */}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="currentColor"
          style={{ fontFamily: "'Mukta', 'Nirmala UI', 'Kohinoor Devanagari', sans-serif", fontSize: "34px", fontWeight: 600 }}>
          सिलाई
        </text>
      </g>
      {variant === "full" && (<>
        <text x="85" y="150" textAnchor="middle" fill="currentColor"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "40px", fontWeight: 500, letterSpacing: "0.16em" }}>
          SILAAI
        </text>
        <text x="85" y="182" textAnchor="middle" fill="currentColor" opacity="0.72"
          style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "16px", fontWeight: 500, letterSpacing: "0.42em" }}>
          STUDIO
        </text>
      </>)}
    </svg>
  );
}
