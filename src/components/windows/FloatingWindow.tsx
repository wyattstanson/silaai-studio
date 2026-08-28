import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "../Icon";
import type { WinState } from "./WindowManager";
import "./windows.css";

interface WM {
  close: (id: string) => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;
  toggleShade: (id: string) => void;
  toggleMax: (id: string) => void;
}

export function FloatingWindow({ win, wm, children }: { win: WinState; wm: WM; children: ReactNode }) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const rez = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (drag.current) {
        const x = Math.max(6, Math.min(e.clientX - drag.current.dx, window.innerWidth - 120));
        const y = Math.max(34, Math.min(e.clientY - drag.current.dy, window.innerHeight - 44));
        wm.move(win.id, x, y);
      } else if (rez.current) {
        wm.resize(win.id, Math.max(320, rez.current.w + (e.clientX - rez.current.x)), Math.max(240, rez.current.h + (e.clientY - rez.current.y)));
      }
    };
    const onUp = () => { drag.current = null; rez.current = null; document.body.style.userSelect = ""; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [win.id, wm]);

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]") || win.maximized) return;
    wm.focus(win.id);
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    document.body.style.userSelect = "none";
  };
  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    wm.focus(win.id);
    rez.current = { x: e.clientX, y: e.clientY, w: win.w, h: win.h };
    document.body.style.userSelect = "none";
  };

  const style = win.maximized
    ? { left: 6, top: 34, width: "calc(100vw - 12px)", height: "calc(100vh - 96px)", zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.shaded ? undefined : win.h, zIndex: win.z };

  return (
    <div className={`fwin ${win.shaded ? "shaded" : ""} ${win.maximized ? "maxed" : ""}`} style={style} onPointerDown={() => wm.focus(win.id)}>
      <div className="fwin-bar" onPointerDown={startDrag} onDoubleClick={() => wm.toggleMax(win.id)}>
        <div className="traffic" data-no-drag>
          <button className="r" title="Close" onClick={() => wm.close(win.id)}><Icon name="close" size={7} strokeWidth={2.4} /></button>
          <button className="y" title={win.shaded ? "Expand" : "Collapse"} onClick={() => wm.toggleShade(win.id)}>
            <svg viewBox="0 0 12 12" width="8" height="8"><path d="M3.2 6h5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <button className="g" title={win.maximized ? "Restore" : "Full screen"} onClick={() => wm.toggleMax(win.id)}>
            <svg viewBox="0 0 12 12" width="8" height="8"><rect x="3.4" y="3.4" width="5.2" height="5.2" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
        </div>
        <div className="fwin-title">
          <b>{win.title}</b>{win.subtitle && <span className="fwin-sub">{win.subtitle}</span>}
        </div>
      </div>
      {!win.shaded && <div className="fwin-body" data-no-drag>{children}</div>}
      {!win.maximized && !win.shaded && <div className="fwin-resize" data-no-drag onPointerDown={startResize} title="Resize" />}
    </div>
  );
}
