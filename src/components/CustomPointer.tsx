import { useEffect } from "react";
import "./cursor.css";

/* A custom pointer: a crisp dot that tracks the cursor exactly and a
   marigold ring that eases behind it, growing over anything clickable.
   Desktop / fine-pointer only; touch and reduced-motion keep the native
   cursor untouched. */
export function CustomPointer() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.append(dot, ring);
    document.documentElement.classList.add("has-custom-cursor");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0, seen = false;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      if (!seen) { seen = true; dot.style.opacity = "1"; ring.style.opacity = "1"; }
      const el = e.target as HTMLElement | null;
      const active = !!el?.closest('a,button,[role="button"],input,select,textarea,label,.list-row,[data-tilt],.dock-item,.hh-row,.pick-chip');
      ring.classList.toggle("is-active", active);
    };
    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");
    const onLeave = () => { dot.style.opacity = "0"; ring.style.opacity = "0"; };

    const loop = () => {
      rx += (mx - rx) * 0.22; ry += (my - ry) * 0.22;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      dot.remove(); ring.remove();
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return null;
}
