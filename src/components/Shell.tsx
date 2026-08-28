import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore } from "../data/store";
import { Icon, type IconName } from "./Icon";
import { Dock, type DockItem } from "./Dock";
import { useDrag } from "../hooks/useDrag";
import { FloatingLayer, type WinState } from "./windows/WindowManager";
import "./Shell.css";

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  group: string;
  count?: number;
  tone?: "accent" | "sage" | "clay" | "neutral";
}

const BUBBLES = [
  { top: "12%", left: "8%", size: 260, c: "var(--acacia)", d: 26 },
  { top: "58%", left: "2%", size: 200, c: "var(--sage)", d: 32 },
  { top: "70%", left: "72%", size: 300, c: "var(--clay)", d: 30 },
  { top: "6%", left: "68%", size: 240, c: "var(--acacia)", d: 36 },
  { top: "38%", left: "44%", size: 180, c: "var(--sage)", d: 24 },
  { top: "82%", left: "40%", size: 150, c: "var(--acacia)", d: 28 },
];

function Bubbles() {
  return (
    <div className="bubbles-bg" aria-hidden>
      {BUBBLES.map((b, i) => (
        <span className="bubble-b" key={i} style={{
          top: b.top, left: b.left, width: b.size, height: b.size,
          background: `radial-gradient(circle at 32% 30%, color-mix(in srgb, ${b.c} 60%, transparent), transparent 70%)`,
          animationDuration: `${b.d}s`, animationDelay: `${-i * 3}s`,
        }} />
      ))}
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const day = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return <span className="mb-clock">{day} · {time}</span>;
}

export function Shell({
  nav, active, onNavigate, crumb, children, onShowcase, onLogout, canManage = true, renderWindow,
}: {
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  crumb: string;
  children: ReactNode;
  onShowcase: () => void;
  onLogout: () => void;
  canManage?: boolean;
  renderWindow?: (win: WinState) => ReactNode;
}) {
  const { db, user, theme, toggleTheme } = useStore();
  const { pos, setPos, onDown } = useDrag(null);
  const [maximized, setMaximized] = useState(false);

  // centre the window on first mount
  useEffect(() => {
    const w = Math.min(1140, window.innerWidth - 48);
    setPos({ x: Math.max(12, (window.innerWidth - w) / 2), y: 52 });
  }, []);

  const groups = useMemo(() => {
    const gs: { name: string; items: NavItem[] }[] = [];
    for (const item of nav) {
      let g = gs.find(x => x.name === item.group);
      if (!g) { g = { name: item.group, items: [] }; gs.push(g); }
      g.items.push(item);
    }
    return gs;
  }, [nav]);

  const dockItems: DockItem[] = nav.map(n => ({ id: n.id, label: n.label, icon: n.icon, tone: n.tone }));
  const dockUtils: DockItem[] = [
    { id: "showcase", label: "Showcase", icon: "showcase", tone: "clay" },
    ...(canManage ? [{ id: "settings", label: "Modules & Settings", icon: "settings" as IconName, tone: "neutral" as const }] : []),
    { id: "__theme", label: theme === "light" ? "Dusk mode" : "Daylight", icon: theme === "light" ? "moon" : "sun", tone: "neutral" },
    { id: "__logout", label: "Sign out", icon: "power", tone: "neutral" },
  ];
  const onDock = (id: string) => {
    if (id === "__theme") return toggleTheme();
    if (id === "__logout") { if (window.confirm("Sign out of Silai?")) onLogout(); return; }
    if (id === "showcase") return onShowcase();
    onNavigate(id);
  };
  const centre = () => { setMaximized(false); const w = Math.min(1140, window.innerWidth - 48); setPos({ x: Math.max(12, (window.innerWidth - w) / 2), y: 52 }); };

  const style = pos && !maximized ? { left: pos.x, top: pos.y } : undefined;

  return (
    <div className="desk">
      <Bubbles />

      <div className="menubar">
        <span className="mb-brand"><Icon name="needle" size={15} className="glyph" /> {db.shop.name}</span>
        <span className="mb-item">{crumb}</span>
        <span className="grow" />
        <div className="mb-right">
          {user && <span>{user.name} · {user.role === "owner" ? "Owner" : "Member"}</span>}
          <button className="mb-btn" onClick={toggleTheme} title="Toggle appearance">
            <Icon name={theme === "light" ? "moon" : "sun"} size={15} />
          </button>
          <Clock />
        </div>
      </div>

      <div className={`window ${maximized ? "maximized" : ""}`} style={style}>
        <div className="titlebar" onPointerDown={maximized ? undefined : onDown} onDoubleClick={() => setMaximized(m => !m)}>
          <div className="traffic" data-no-drag>
            <button className="r" onClick={onShowcase} title="Close to showcase"><Icon name="close" size={7} strokeWidth={2.4} /></button>
            <button className="y" onClick={centre} title="Centre window">
              <svg viewBox="0 0 12 12" width="8" height="8"><path d="M3.2 6h5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
            <button className="g" onClick={() => setMaximized(m => !m)} title={maximized ? "Exit full screen" : "Full screen"}>
              <svg viewBox="0 0 12 12" width="8" height="8"><rect x="3.4" y="3.4" width="5.2" height="5.2" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
            </button>
          </div>
          <div className="tt">
            <b>{db.shop.name}</b><span className="crumb">›</span><span className="crumb">{crumb}</span>
          </div>
        </div>

        <aside className="sidebar" data-no-drag>
          <div className="brand">
            <div className="mark">S</div>
            <div className="who"><b>Silai</b><span>Tailoring Studio · {db.shop.batch}</span></div>
          </div>

          {groups.map(g => (
            <div key={g.name}>
              <div className="nav-group"><span className="eyebrow">{g.name}</span></div>
              {g.items.map(item => (
                <button key={item.id} className="nav-item" aria-current={active === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>
                  <span className="ni-ico"><Icon name={item.icon} size={17} /></span>
                  <span>{item.label}</span>
                  {item.count != null && item.count > 0 && <span className="count">{item.count}</span>}
                </button>
              ))}
            </div>
          ))}

          <div className="sidebar-foot">
            <button className="nav-item" onClick={onShowcase}>
              <span className="ni-ico"><Icon name="showcase" size={17} /></span><span>View Showcase</span>
            </button>
            {canManage && (
              <button className="nav-item" aria-current={active === "settings" ? "page" : undefined} onClick={() => onNavigate("settings")}>
                <span className="ni-ico"><Icon name="settings" size={17} /></span><span>Modules &amp; Settings</span>
              </button>
            )}
          </div>
        </aside>

        <main className="main" data-no-drag>
          <div className="main-inner">{children}</div>
        </main>
      </div>

      {renderWindow && <FloatingLayer renderContent={renderWindow} />}

      <Dock items={dockItems} utils={dockUtils} active={active} onSelect={onDock} />
    </div>
  );
}
