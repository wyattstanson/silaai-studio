/* Hand-drawn savannah-toned garment silhouettes, fully offline SVG.
   Each takes a palette {main, deep, trim} so the gallery stays on-brand. */

export type GarmentType = "lehenga" | "sherwani" | "saree" | "anarkali" | "kurta" | "blouse";

interface Pal { main: string; deep: string; trim: string; }

const PALETTES: Record<string, Pal> = {
  maroon:  { main: "#9d5b52", deep: "#7c4038", trim: "#d9a24c" },
  ochre:   { main: "#c39a52", deep: "#9a7431", trim: "#6f7c4e" },
  sage:    { main: "#7f8a5c", deep: "#5c663e", trim: "#c39a52" },
  clay:    { main: "#b57250", deep: "#8f5537", trim: "#e0c07a" },
  indigo:  { main: "#5f6b74", deep: "#414b53", trim: "#c39a52" },
  cream:   { main: "#d9c7a3", deep: "#b8a271", trim: "#9d5b52" },
};

function Stitch({ d, color }: { d: string; color: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeDasharray="2 4" strokeLinecap="round" opacity="0.85" />;
}

export function GarmentArt({ type, palette = "ochre" }: { type: GarmentType; palette?: keyof typeof PALETTES }) {
  const p = PALETTES[palette] ?? PALETTES.ochre;
  return (
    <svg viewBox="0 0 240 280" width="100%" height="100%" role="img" aria-label={type}>
      <defs>
        <linearGradient id={`g-${type}-${palette}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.main} />
          <stop offset="1" stopColor={p.deep} />
        </linearGradient>
      </defs>
      {shape(type, p, `g-${type}-${palette}`)}
    </svg>
  );
}

function shape(type: GarmentType, p: Pal, grad: string) {
  const fill = `url(#${grad})`;
  switch (type) {
    case "lehenga":
      return (
        <g>
          {/* blouse */}
          <path d="M120 40 L150 52 L146 96 L94 96 L90 52 Z" fill={p.deep} />
          <path d="M120 40 L150 52 L120 62 L90 52 Z" fill={p.trim} opacity="0.9" />
          {/* waistband */}
          <rect x="92" y="98" width="56" height="8" rx="3" fill={p.trim} />
          {/* flared skirt */}
          <path d="M96 108 L144 108 L214 250 Q120 268 26 250 Z" fill={fill} />
          <Stitch d="M96 108 L26 250" color={p.trim} />
          <Stitch d="M144 108 L214 250" color={p.trim} />
          <path d="M26 250 Q120 268 214 250" fill="none" stroke={p.trim} strokeWidth="3" />
          {/* motifs */}
          {[70, 105, 140, 175].map((y, i) => <circle key={i} cx={120} cy={y + 60} r="3.2" fill={p.trim} opacity="0.8" />)}
        </g>
      );
    case "sherwani":
      return (
        <g>
          <path d="M120 42 L152 54 L150 74 L90 74 L88 54 Z" fill={p.deep} />
          {/* collar */}
          <path d="M120 42 L132 52 L120 66 L108 52 Z" fill={p.trim} />
          {/* long coat */}
          <path d="M90 74 L150 74 L162 236 L78 236 Z" fill={fill} />
          {/* center placket + buttons */}
          <line x1="120" y1="70" x2="120" y2="232" stroke={p.trim} strokeWidth="2.4" />
          {[92, 116, 140, 164, 188, 212].map((y, i) => <circle key={i} cx="120" cy={y} r="3" fill={p.trim} />)}
          <Stitch d="M90 74 L78 236" color={p.trim} />
          <Stitch d="M150 74 L162 236" color={p.trim} />
        </g>
      );
    case "saree":
      return (
        <g>
          {/* blouse */}
          <path d="M118 44 L146 56 L142 92 L96 92 L92 56 Z" fill={p.deep} />
          {/* draped skirt */}
          <path d="M96 92 L142 92 L182 246 Q120 260 58 246 Z" fill={fill} />
          {/* pallu diagonal */}
          <path d="M142 92 Q196 120 176 210 L150 210 Q168 150 118 108 Z" fill={p.trim} opacity="0.9" />
          {/* pleats */}
          {[104, 118, 132].map((x, i) => <line key={i} x1={x} y1="110" x2={x - 8 + i * 2} y2="244" stroke={p.deep} strokeWidth="1.6" opacity="0.6" />)}
          <path d="M58 246 Q120 260 182 246" fill="none" stroke={p.trim} strokeWidth="3" />
        </g>
      );
    case "anarkali":
      return (
        <g>
          <path d="M120 40 L148 52 L146 90 L94 90 L92 52 Z" fill={p.deep} />
          <rect x="96" y="90" width="48" height="26" fill={p.deep} />
          {/* big flare */}
          <path d="M96 116 L144 116 L206 252 Q120 270 34 252 Z" fill={fill} />
          <line x1="120" y1="52" x2="120" y2="252" stroke={p.trim} strokeWidth="1.6" opacity="0.7" />
          <path d="M34 252 Q120 270 206 252" fill="none" stroke={p.trim} strokeWidth="3" />
          <Stitch d="M96 116 L34 252" color={p.trim} />
          <Stitch d="M144 116 L206 252" color={p.trim} />
        </g>
      );
    case "kurta":
      return (
        <g>
          {/* sleeves */}
          <path d="M88 66 L60 120 L74 128 L96 84 Z" fill={p.deep} />
          <path d="M152 66 L180 120 L166 128 L144 84 Z" fill={p.deep} />
          {/* straight tunic */}
          <path d="M92 60 L148 60 L152 232 L88 232 Z" fill={fill} />
          <path d="M120 58 L134 68 L120 82 L106 68 Z" fill={p.deep} />
          <line x1="120" y1="82" x2="120" y2="150" stroke={p.trim} strokeWidth="2" />
          {[96, 116, 136].map((y, i) => <circle key={i} cx="120" cy={y} r="2.4" fill={p.trim} />)}
          <Stitch d="M88 232 L92 60" color={p.trim} />
          <Stitch d="M152 232 L148 60" color={p.trim} />
        </g>
      );
    case "blouse":
      return (
        <g>
          <path d="M86 78 L58 116 L72 126 L98 92 Z" fill={p.deep} />
          <path d="M154 78 L182 116 L168 126 L142 92 Z" fill={p.deep} />
          <path d="M92 70 L148 70 L156 150 L84 150 Z" fill={fill} />
          <path d="M120 68 L138 82 L120 100 L102 82 Z" fill={p.deep} />
          <path d="M84 150 L156 150 L150 168 L90 168 Z" fill={p.trim} />
          <Stitch d="M92 70 L84 150" color={p.trim} />
          <Stitch d="M148 70 L156 150" color={p.trim} />
        </g>
      );
  }
}

export const PALETTE_KEYS = Object.keys(PALETTES);
