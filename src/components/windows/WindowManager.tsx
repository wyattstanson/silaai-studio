import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { FloatingWindow } from "./FloatingWindow";

export interface WinSpec {
  kind: string;             // "order" | "customer" | ...
  key: string;              // dedupe key, e.g. the order id
  title: string;
  subtitle?: string;
  payload?: any;
  w?: number;
  h?: number;
}
export interface WinState extends Required<Omit<WinSpec, "subtitle" | "payload">> {
  id: string;
  subtitle?: string;
  payload?: any;
  x: number; y: number;
  z: number;
  shaded: boolean;
  maximized: boolean;
}

interface WM {
  windows: WinState[];
  open: (s: WinSpec) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;
  toggleShade: (id: string) => void;
  toggleMax: (id: string) => void;
}

const Ctx = createContext<WM | null>(null);

export function WindowProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WinState[]>([]);
  const z = useRef(100);
  const count = useRef(0);

  const focus = useCallback((id: string) => {
    z.current += 1;
    setWindows(ws => ws.map(w => (w.id === id ? { ...w, z: z.current } : w)));
  }, []);

  const open = useCallback((s: WinSpec) => {
    setWindows(ws => {
      const existing = ws.find(w => w.kind === s.kind && w.key === s.key);
      z.current += 1;
      if (existing) return ws.map(w => (w.id === existing.id ? { ...w, z: z.current, shaded: false } : w));
      const w = Math.min(s.w ?? 460, window.innerWidth - 40);
      const h = s.h ?? 540;
      const off = (count.current++ % 6) * 30;
      const x = Math.max(20, Math.round(window.innerWidth / 2 - w / 2) + off);
      const y = Math.max(60, 90 + off);
      return [...ws, {
        id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind: s.kind, key: s.key, title: s.title, subtitle: s.subtitle, payload: s.payload,
        w, h, x, y, z: z.current, shaded: false, maximized: false,
      }];
    });
  }, []);

  const close = useCallback((id: string) => setWindows(ws => ws.filter(w => w.id !== id)), []);
  const move = useCallback((id: string, x: number, y: number) => setWindows(ws => ws.map(w => (w.id === id ? { ...w, x, y } : w))), []);
  const resize = useCallback((id: string, w: number, h: number) => setWindows(ws => ws.map(x => (x.id === id ? { ...x, w, h } : x))), []);
  const toggleShade = useCallback((id: string) => setWindows(ws => ws.map(w => (w.id === id ? { ...w, shaded: !w.shaded } : w))), []);
  const toggleMax = useCallback((id: string) => setWindows(ws => ws.map(w => (w.id === id ? { ...w, maximized: !w.maximized } : w))), []);

  return <Ctx.Provider value={{ windows, open, close, focus, move, resize, toggleShade, toggleMax }}>{children}</Ctx.Provider>;
}

export function useWindows() {
  const wm = useContext(Ctx);
  if (!wm) throw new Error("useWindows must be used within WindowProvider");
  return wm;
}

/** Renders every open floating window. `renderContent` maps a window to its body. */
export function FloatingLayer({ renderContent }: { renderContent: (win: WinState) => ReactNode }) {
  const wm = useWindows();
  return (
    <>
      {wm.windows.map(w => (
        <FloatingWindow key={w.id} win={w} wm={wm}>
          {renderContent(w)}
        </FloatingWindow>
      ))}
    </>
  );
}
