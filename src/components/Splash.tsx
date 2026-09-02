import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import "./splash.css";

/* Branded boot screen: the SILAAI lockup over festive near-black with a
   stitching progress line, then it fades away. Stays inert after fading. */
export function Splash() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setDone(true), reduce ? 400 : 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={"splash" + (done ? " done" : "")} aria-hidden={done}>
      <div className="splash-inner">
        <Logo variant="full" size={72} className="splash-logo" />
        <div className="splash-tag">Measured to you. Stitched by hand.</div>
        <div className="splash-rail"><span /></div>
      </div>
    </div>
  );
}
