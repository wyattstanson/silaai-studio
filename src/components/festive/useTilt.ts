import { useEffect } from "react";

/* Pointer-reactive 3D tilt for every [data-tilt] inside `root`.
   The card leans toward the cursor and lifts slightly (translateZ),
   like the depth cards on emergent. Inline transform wins over CSS,
   and is cleared on leave. Skipped under prefers-reduced-motion. */
export function useTilt(root: React.RefObject<HTMLElement>, deps: unknown[] = []) {
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(host.querySelectorAll<HTMLElement>("[data-tilt]"));
    const cleanups: Array<() => void> = [];

    for (const el of els) {
      let raf = 0;
      const move = (e: PointerEvent) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          const max = 9; // degrees
          el.style.transform =
            `perspective(760px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(10px)`;
        });
      };
      const enter = () => { el.style.transition = "transform .12s var(--ease)"; el.style.willChange = "transform"; };
      const leave = () => {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        el.style.transition = "transform .35s var(--ease)";
        el.style.transform = "";
        el.style.willChange = "";
      };
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = ""; el.style.transition = ""; el.style.willChange = "";
      });
    }
    return () => cleanups.forEach(fn => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
