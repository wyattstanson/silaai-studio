/* Silai, a hand-drawn icon family. Not lucide, not emoji.
   One 24-grid, one stroke weight, rounded joins, currentColor.
   Duotone: a soft filled backing shape + a crisp line on top. */
import type { CSSProperties } from "react";

export type IconName =
  | "overview" | "orders" | "customers" | "payments" | "reports"
  | "sales" | "courier" | "course" | "settings" | "showcase"
  | "measure" | "history" | "power" | "sun" | "moon"
  | "phone" | "mail" | "pin" | "spark" | "camera"
  | "back" | "plus" | "search" | "close" | "chevron"
  | "flag" | "needle" | "hanger" | "check" | "clock" | "requests" | "calendar";

const soft = { fill: "currentColor", opacity: 0.14, stroke: "none" } as const;

export function Icon({ name, size = 18, strokeWidth = 1.7, className, style }: {
  name: IconName; size?: number; strokeWidth?: number; className?: string; style?: CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}
      fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden focusable="false">
      {glyph(name)}
    </svg>
  );
}

function glyph(name: IconName) {
  switch (name) {
    case "overview": return (<>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" {...soft} />
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="3.5" width="7.5" height="5" rx="2" />
      <rect x="13" y="11" width="7.5" height="9.5" rx="2" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="2" />
    </>);
    case "orders": return (<>
      <circle cx="6" cy="7" r="2.4" />
      <circle cx="6" cy="17" r="2.4" />
      <path d="M8 8.4 L20 16" /><path d="M8 15.6 L20 8" />
      <path d="M12.5 12 L15 13.6" />
    </>);
    case "customers": return (<>
      <circle cx="9" cy="8" r="3" {...soft} /><circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5c0-3.3 2.5-5.2 5.5-5.2s5.5 1.9 5.5 5.2" />
      <path d="M16 5.6a3 3 0 0 1 0 5.6" /><path d="M17.5 14.6c2.2.5 3.5 2.2 3.5 4.6" />
    </>);
    case "payments": return (<>
      <rect x="3" y="6" width="18" height="12" rx="2.4" {...soft} />
      <rect x="3" y="6" width="18" height="12" rx="2.4" />
      <path d="M9.5 9.5h4M9.5 12h4M13.5 9.5c0 2.4-2 3-4 3l3.2 2.5" />
    </>);
    case "reports": return (<>
      <path d="M4 20h16" />
      <rect x="5.5" y="12" width="3.2" height="6" rx="1" {...soft} /><rect x="5.5" y="12" width="3.2" height="6" rx="1" />
      <rect x="10.4" y="8" width="3.2" height="10" rx="1" />
      <rect x="15.3" y="4.5" width="3.2" height="13.5" rx="1" {...soft} /><rect x="15.3" y="4.5" width="3.2" height="13.5" rx="1" />
    </>);
    case "sales": return (<>
      <rect x="7" y="4" width="10" height="16" rx="1.4" {...soft} /><rect x="7" y="4" width="10" height="16" rx="1.4" />
      <path d="M5 5.5h14M5 18.5h14" /><path d="M9.5 8.2h5M9.5 11h5M9.5 13.8h5" />
    </>);
    case "courier": return (<>
      <path d="M12 3.2 20 7v10l-8 3.8L4 17V7z" {...soft} />
      <path d="M12 3.2 20 7v10l-8 3.8L4 17V7z" />
      <path d="M4 7l8 3.8L20 7M12 10.8V20.8" />
    </>);
    case "course": return (<>
      <path d="M12 4 22 8.5 12 13 2 8.5z" {...soft} /><path d="M12 4 22 8.5 12 13 2 8.5z" />
      <path d="M6 10.5V15c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5M20 9v4.5" />
    </>);
    case "settings": return (<>
      <path d="M4 7h9M17 7h3" /><circle cx="15" cy="7" r="2.2" {...soft} /><circle cx="15" cy="7" r="2.2" />
      <path d="M4 17h5M13 17h7" /><circle cx="11" cy="17" r="2.2" {...soft} /><circle cx="11" cy="17" r="2.2" />
    </>);
    case "showcase":
    case "hanger": return (<>
      <path d="M12 4.5a2 2 0 0 0-2 2c0 1.2 1 1.7 2 2.1" />
      <path d="M12 8.6 4 15c-1.2 1-.6 2.8 1 2.8h14c1.6 0 2.2-1.8 1-2.8L12 8.6z" {...soft} />
      <path d="M12 8.6 4 15c-1.2 1-.6 2.8 1 2.8h14c1.6 0 2.2-1.8 1-2.8L12 8.6z" />
    </>);
    case "measure": return (<>
      <rect x="2.4" y="8" width="19.2" height="8" rx="2" transform="rotate(-8 12 12)" {...soft} />
      <rect x="2.4" y="8" width="19.2" height="8" rx="2" transform="rotate(-8 12 12)" />
      <path d="M7 8.6v2.6M11 7.9v3.4M15 7.2v2.6M19 6.6v3.4" />
    </>);
    case "history":
    case "clock": return (<>
      <circle cx="12" cy="12" r="8.2" {...soft} /><circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.6V12l3 2" />
    </>);
    case "power": return (<><path d="M12 3v8" /><path d="M6.5 7a8 8 0 1 0 11 0" /></>);
    case "sun": return (<>
      <circle cx="12" cy="12" r="4" {...soft} /><circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
    </>);
    case "moon": return (<>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z" {...soft} />
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z" />
    </>);
    case "phone": return (<>
      <path d="M6.5 3.5h3l1.4 4-2 1.3a11 11 0 0 0 4.9 4.9l1.3-2 4 1.4v3c0 1.1-.9 2-2 2C13 21.6 4.4 13 3.6 6c-.1-1.1.8-2 1.9-2z" {...soft} />
      <path d="M6.5 3.5h3l1.4 4-2 1.3a11 11 0 0 0 4.9 4.9l1.3-2 4 1.4v3c0 1.1-.9 2-2 2C13 21.6 4.4 13 3.6 6c-.1-1.1.8-2 1.9-2z" />
    </>);
    case "mail": return (<>
      <rect x="3" y="5.5" width="18" height="13" rx="2.4" {...soft} /><rect x="3" y="5.5" width="18" height="13" rx="2.4" />
      <path d="M4 7l8 5.5L20 7" />
    </>);
    case "pin": return (<>
      <path d="M12 21c4-4.4 6-7.6 6-10.5A6 6 0 0 0 6 10.5C6 13.4 8 16.6 12 21z" {...soft} />
      <path d="M12 21c4-4.4 6-7.6 6-10.5A6 6 0 0 0 6 10.5C6 13.4 8 16.6 12 21z" />
      <circle cx="12" cy="10.4" r="2.2" />
    </>);
    case "spark": return (<>
      <path d="M12 3c.6 4.4 1.6 5.4 6 6-4.4.6-5.4 1.6-6 6-.6-4.4-1.6-5.4-6-6 4.4-.6 5.4-1.6 6-6z" {...soft} />
      <path d="M12 3c.6 4.4 1.6 5.4 6 6-4.4.6-5.4 1.6-6 6-.6-4.4-1.6-5.4-6-6 4.4-.6 5.4-1.6 6-6z" />
    </>);
    case "camera": return (<>
      <rect x="3.5" y="4.5" width="17" height="15" rx="4.5" {...soft} /><rect x="3.5" y="4.5" width="17" height="15" rx="4.5" />
      <circle cx="12" cy="12" r="3.4" /><circle cx="17" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </>);
    case "needle": return (<><path d="M4 20 18 6" /><circle cx="19.2" cy="4.8" r="1.6" {...soft} /><circle cx="19.2" cy="4.8" r="1.6" /><path d="M18.6 5.4l-1.2-1.2" /></>);
    case "back": return (<><path d="M14 6l-6 6 6 6" /><path d="M8 12h11" /></>);
    case "plus": return (<><path d="M12 5v14M5 12h14" /></>);
    case "search": return (<><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>);
    case "close": return (<><path d="M6 6l12 12M18 6L6 18" /></>);
    case "chevron": return (<><path d="M9 6l6 6-6 6" /></>);
    case "check": return (<><path d="M5 12.5 10 17 19 7" /></>);
    case "flag": return (<><path d="M6 21V4" /><path d="M6 5h10l-1.6 3L16 11H6z" {...soft} /><path d="M6 5h10l-1.6 3L16 11H6z" /></>);
    case "requests": return (<>
      <rect x="3.5" y="5" width="17" height="14" rx="2.4" {...soft} />
      <rect x="3.5" y="5" width="17" height="14" rx="2.4" />
      <path d="M3.5 13.5h5a3.5 3.5 0 0 0 7 0h5" />
    </>);
    case "calendar": return (<>
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" {...soft} />
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </>);
    default: return null;
  }
}
