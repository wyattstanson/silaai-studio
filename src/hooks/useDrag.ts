import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface Pos { x: number; y: number; }

/** Pointer-drag a window by a handle, clamped so the titlebar stays reachable. */
export function useDrag(initial: Pos | null) {
  const [pos, setPos] = useState<Pos | null>(initial);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const posRef = useRef<Pos | null>(initial);
  posRef.current = pos;

  const clamp = (x: number, y: number): Pos => ({
    x: Math.max(8, Math.min(x, window.innerWidth - 140)),
    y: Math.max(32, Math.min(y, window.innerHeight - 56)),
  });

  const onDown = useCallback((e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    const start = posRef.current ?? { x: 0, y: 0 };
    drag.current = { dx: e.clientX - start.x, dy: e.clientY - start.y };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current) return;
      setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
    };
    const up = () => { drag.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  return { pos, setPos, onDown };
}
