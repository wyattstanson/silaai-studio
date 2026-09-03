import { useEffect } from "react";
import "./cursor.css";

/* Custom pointer shaped like a tailor's needle with a gold thread.
   The needle tip is the hotspot and tracks the cursor exactly; it grows
   a touch over anything clickable. Desktop / fine-pointer only; touch and
   reduced-motion keep the native cursor untouched.

   Robustness: it shows on any pointer movement or re-entry and only hides
   while the pointer is actually outside the window, so it can never get
   stuck hidden (the previous version stayed hidden after the first exit). */
const NEEDLE = `
<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="steel" x1="2" y1="2" x2="24" y2="24" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fbfdff"/><stop offset="0.5" stop-color="#c3ccd6"/><stop offset="1" stop-color="#7c8794"/>
    </linearGradient>
  </defs>
  <!-- needle shaft, sharp tip at top-left (hotspot) -->
  <path d="M2.2 2.2 L22.6 19.4 L19.4 22.6 Z" fill="url(#steel)" stroke="#5a636e" stroke-width="0.6" stroke-linejoin="round"/>
  <!-- bright edge highlight -->
  <path d="M2.2 2.2 L22.6 19.4" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" opacity="0.85"/>
  <!-- eye -->
  <circle cx="20.4" cy="20.4" r="1.5" fill="#39414b"/>
  <!-- gold thread looping from the eye -->
  <path d="M21 21 C 29 19.5, 31.5 27, 26.5 29.5 C 23 31, 23.5 25.8, 27.5 26.8"
        fill="none" stroke="#e1b552" stroke-width="1.7" stroke-linecap="round"/>
</svg>`;

export function CustomPointer() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return; // touch: leave native cursor alone

    const el = document.createElement("div");
    el.className = "cursor-needle";
    el.innerHTML = `<span class="n">${NEEDLE}</span>`;
    document.body.appendChild(el);
    document.documentElement.classList.add("has-custom-cursor");

    const inner = el.firstElementChild as HTMLElement;

    const show = () => { el.style.opacity = "1"; };
    const hide = () => { el.style.opacity = "0"; };

    const onMove = (e: PointerEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      show(); // always re-show on movement — never gets stuck hidden
      if (reduce) return;
      const t = e.target;
      const active = t instanceof Element &&
        !!t.closest('a,button,[role="button"],input,select,textarea,label,.list-row,[data-tilt],.dock-item,.hh-row,.pick-chip,.req-type,.g-card');
      inner.classList.toggle("is-active", active);
    };
    const onDown = () => inner.classList.add("is-down");
    const onUp = () => inner.classList.remove("is-down");
    const onEnter = () => show();
    // only hide when the pointer truly leaves the window
    const onOut = (e: PointerEvent) => { if (!e.relatedTarget && !(e as any).toElement) hide(); };
    const onWinBlur = () => hide();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointerenter", onEnter, { passive: true });
    document.addEventListener("pointerover", onEnter, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("blur", onWinBlur);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerenter", onEnter);
      document.removeEventListener("pointerover", onEnter);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", onWinBlur);
      el.remove();
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return null;
}
