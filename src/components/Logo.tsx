import "./logo.css";

/* SILAAI STUDIO brand mark, rebuilt to match the supplied logo:
   a thin + bold double ring with eight rivet dots, a navy dashed inner
   ring, the two-tone सि (Hindi) + லை (Tamil) monogram over a small dashed
   rule, and — in the `full` lockup — the SILAAI serif wordmark above a
   navy dashed line with STUDIO tracked beneath.
   Colours: `currentColor` for the ink, `--logo-accent` for the navy, so
   it inverts cleanly on light and dark. */

const R = 44;                    // bold ring radius
const dots = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 - Math.PI / 2;
  return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) };
});

function Ring() {
  return (
    <g>
      <circle cx="50" cy="50" r="47.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.9" />
      <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="3.2" />
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="1.9" fill="currentColor" />)}
      <circle cx="50" cy="50" r="37" fill="none" className="logo-accent-stroke" strokeWidth="1" strokeDasharray="2.2 3.4" />
      {/* सि (Hindi) + லै (Tamil) */}
      <text x="36" y="50" textAnchor="middle" dominantBaseline="central" fill="currentColor"
        style={{ fontFamily: "'Mukta','Nirmala UI',sans-serif", fontSize: "26px", fontWeight: 600 }}>सि</text>
      <text x="63" y="51" textAnchor="middle" dominantBaseline="central" className="logo-accent-fill"
        style={{ fontFamily: "'Mukta Malar','Nirmala UI',sans-serif", fontSize: "23px", fontWeight: 600 }}>லை</text>
      {/* little dashed rule under the monogram */}
      <line x1="43" y1="70" x2="57" y2="70" className="logo-accent-stroke" strokeWidth="1.4" strokeDasharray="3 3" strokeLinecap="round" />
    </g>
  );
}

export function Logo({ variant = "mark", size = 34, className }: { variant?: "mark" | "full"; size?: number; className?: string }) {
  const cls = "logo-svg" + (className ? " " + className : "");
  if (variant === "mark") {
    return (
      <svg className={cls} width={size} height={size} viewBox="0 0 100 100" fill="none" role="img" aria-label="Silaai Studio">
        <Ring />
      </svg>
    );
  }
  const w = size * 2.05, h = size * 2.7;
  return (
    <svg className={cls} width={w} height={h} viewBox="0 0 205 270" fill="none" role="img" aria-label="Silaai Studio">
      <g transform="translate(52.5 0)"><Ring /></g>
      <text x="102.5" y="205" textAnchor="middle" fill="currentColor"
        style={{ fontFamily: "'Cinzel',Georgia,serif", fontSize: "44px", fontWeight: 600, letterSpacing: "0.12em" }}>SILAAI</text>
      <line x1="42" y1="224" x2="163" y2="224" className="logo-accent-stroke" strokeWidth="1.6" strokeDasharray="7 6" strokeLinecap="round" />
      <text x="102.5" y="252" textAnchor="middle" fill="currentColor" opacity="0.62"
        style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: "15px", fontWeight: 500, letterSpacing: "0.5em" }}>STUDIO</text>
    </svg>
  );
}
