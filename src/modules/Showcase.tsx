import { useEffect, useRef } from "react";
import { useStore } from "../data/store";
import { Button } from "../components/ui/ui";
import { Icon } from "../components/Icon";
import { GarmentArt, type GarmentType } from "../components/GarmentArt";
import { useTilt } from "../components/festive/useTilt";
import { Logo } from "../components/Logo";
import { inr } from "../lib/format";
import "./showcase.css";

const scrollTop = () => document.querySelector(".sc")?.scrollTo({ top: 0, behavior: "smooth" });

/* Reveal-on-scroll + a light hero parallax.
   Progressive enhancement: content is visible by default and only hidden
   once JS marks the container `reveal-ready`, so a JS/observer failure can
   never leave a blank page. Uses scroll + rAF (reliable everywhere) plus a
   safety timeout, and is skipped entirely under prefers-reduced-motion. */
function useScrollChrome(scRef: React.RefObject<HTMLDivElement>, figRef: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const root = scRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    root.classList.add("reveal-ready");

    if (reduce) { els.forEach(e => e.classList.add("rv-in")); return; }

    const reveal = () => {
      const vh = window.innerHeight;
      for (const e of els) {
        if (e.classList.contains("rv-in")) continue;
        if (e.getBoundingClientRect().top < vh * 0.9) e.classList.add("rv-in");
      }
    };

    let raf = 0;
    const onScroll = () => {
      if (figRef.current) figRef.current.style.transform = `translateY(${Math.min(root.scrollTop * 0.05, 40)}px)`;
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; reveal(); });
    };

    reveal();                         // above-the-fold, immediately
    requestAnimationFrame(reveal);    // after first paint
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", reveal);
    // safety net: never leave anything hidden, whatever the environment
    const safety = window.setTimeout(() => els.forEach(e => e.classList.add("rv-in")), 2400);

    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", reveal);
      window.clearTimeout(safety);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scRef, figRef]);
}

const PIECES: { type: GarmentType; palette: string; name: string; fabric: string; price: number; tag: string }[] = [
  { type: "lehenga", palette: "maroon", name: "Zardozi Bridal Lehenga", fabric: "Raw silk · hand embroidery", price: 24000, tag: "Bridal" },
  { type: "sherwani", palette: "cream", name: "Brocade Sherwani", fabric: "Cream brocade · self-work", price: 16500, tag: "Wedding" },
  { type: "saree", palette: "sage", name: "Kanjivaram Drape & Blouse", fabric: "Pure silk · princess cut", price: 4200, tag: "Festive" },
  { type: "anarkali", palette: "ochre", name: "Full-Flare Anarkali", fabric: "Georgette · churidar", price: 5200, tag: "Occasion" },
  { type: "kurta", palette: "indigo", name: "Mandarin Kurta Set", fabric: "Handloom cotton · indigo", price: 1800, tag: "Everyday" },
  { type: "blouse", palette: "clay", name: "Boat-Neck Silk Blouse", fabric: "Piping detail · lined", price: 1200, tag: "Custom" },
  { type: "lehenga", palette: "ochre", name: "Festive Ochre Lehenga", fabric: "Chanderi · gota trim", price: 14000, tag: "Festive" },
  { type: "kurta", palette: "sage", name: "Olive Nehru Set", fabric: "Linen blend · bandhgala", price: 3600, tag: "Formal" },
];

export function Showcase({ onEnter, onBack, loggedIn }: { onEnter: () => void; onBack?: () => void; loggedIn?: boolean }) {
  const { db, theme, toggleTheme } = useStore();
  const stitched = db.orders.length + 148;
  const scRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  useScrollChrome(scRef, figRef);
  useTilt(scRef);

  return (
    <div className="sc" ref={scRef}>
      <div className="sc-bar">
        <button className="logo" onClick={scrollTop} aria-label="Back to top"><Logo size={26} className="sc-logo-mark" /> Silaai</button>
        <div className="grow" />
        <a href="#gallery" className="hide-sm">Collection</a>
        <a href="#contact" className="hide-sm">Contact</a>
        <button className="theme-btn" onClick={toggleTheme} title="Toggle appearance" aria-label="Toggle appearance">
          <Icon name={theme === "light" ? "moon" : "sun"} size={16} />
        </button>
        {loggedIn && onBack
          ? <Button size="sm" onClick={onBack}><Icon name="back" size={14} /> Back to studio</Button>
          : <Button variant="primary" size="sm" onClick={onEnter}>Sign in</Button>}
      </div>

      <div className="ribbon">
        <div className="strip">
          <span>Handcrafted</span><i className="rdot" />
          <span>Bespoke Tailoring</span><i className="rdot" />
          <span>Bridal &amp; Wedding</span><i className="rdot" />
          <span>Est. 24BCE</span><i className="rdot" />
          <span>Measured to You</span>
        </div>
      </div>

      <div className="sc-inner">
        {/* HERO */}
        <section className="hero">
          <div data-reveal>
            <span className="eyebrow">सिलाई · Silaai Studio</span>
            <h1>Where fabric<br />becomes <em>heirloom</em>.</h1>
            <p className="hero-tag">Measured to you. Stitched by hand.</p>
            <p>
              A family atelier for bridal, festive and everyday wear, measured, stitched and finished by hand.
              Browse the collection, then step into your family portal to track every order, fitting and payment.
            </p>
            <div className="cta">
              <Button variant="primary" onClick={onEnter}>{loggedIn ? "Open portal" : "Sign in with phone"}</Button>
              <a href="#gallery"><Button>View collection</Button></a>
            </div>
          </div>
          <div className="hero-figure" aria-hidden ref={figRef} data-reveal style={{ transitionDelay: "0.08s" }}>
            {(["lehenga", "sherwani", "saree", "anarkali", "kurta", "blouse"] as GarmentType[]).map((t, i) => (
              <div className="h-cell" key={i} data-tilt><GarmentArt type={t} palette={["maroon", "cream", "sage", "ochre", "indigo", "clay"][i] as any} /></div>
            ))}
          </div>
        </section>

        {/* STATS */}
        <div className="strip">
          <div className="s" data-reveal><b>{stitched}+</b><span>garments stitched</span></div>
          <div className="s" data-reveal style={{ transitionDelay: "0.06s" }}><b>{db.families.length + 60}</b><span>families served</span></div>
          <div className="s" data-reveal style={{ transitionDelay: "0.12s" }}><b>12</b><span>years of craft</span></div>
          <div className="s" data-reveal style={{ transitionDelay: "0.18s" }}><b>48h</b><span>express fittings</span></div>
        </div>

        {/* GALLERY */}
        <section className="gallery" id="gallery">
          <div className="sc-head">
            <div data-reveal>
              <span className="eyebrow">The Collection</span>
              <h2>Our recent work</h2>
              <p>A glimpse of pieces from the studio, every one made to measure.</p>
            </div>
          </div>
          <div className="g-grid">
            {PIECES.map((pc, i) => (
              <article className="g-card" key={i} data-reveal data-tilt style={{ transitionDelay: `${(i % 4) * 0.06}s` }}>
                <div className="g-art"><GarmentArt type={pc.type} palette={pc.palette as any} /></div>
                <div className="g-meta">
                  <div className="g-name">{pc.name}</div>
                  <div className="g-fab">{pc.fabric}</div>
                  <div className="g-foot">
                    <span className="g-price">from {inr(pc.price)}</span>
                    <span className="g-tag">{pc.tag}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section className="contact" id="contact">
          <div className="sc-head">
            <div data-reveal>
              <span className="eyebrow">Say hello</span>
              <h2>Visit the studio</h2>
              <p>Walk in for a fitting, or reach us any way you like.</p>
            </div>
          </div>
          <div className="bubbles">
            <a className="bubble" data-reveal href={`tel:${db.shop.phone.replace(/\s+/g, "")}`} style={{ ["--tone" as any]: "var(--acacia)" }}>
              <div className="b-ico"><Icon name="phone" size={20} /></div>
              <h4>Call &amp; WhatsApp</h4>
              <span className="b-link">{db.shop.phone}</span>
              <p>Mon to Sat, 10am to 8pm</p>
            </a>
            <div className="bubble" data-reveal style={{ ["--tone" as any]: "var(--sage)", transitionDelay: "0.06s" }}>
              <div className="b-ico"><Icon name="mail" size={20} /></div>
              <h4>Email us</h4>
              <a href="mailto:hello@silaistudio.in">hello@silaistudio.in</a>
              <a href="mailto:orders@silaistudio.in">orders@silaistudio.in</a>
            </div>
            <a className="bubble" data-reveal href="https://maps.google.com/?q=Katpadi+Vellore" target="_blank" rel="noreferrer" style={{ ["--tone" as any]: "var(--clay)", transitionDelay: "0.12s" }}>
              <div className="b-ico"><Icon name="pin" size={20} /></div>
              <h4>Find us</h4>
              <p>12, Weavers Lane<br />Katpadi, Vellore 632014</p>
            </a>
            <div className="bubble" data-reveal style={{ ["--tone" as any]: "var(--plum)", transitionDelay: "0.18s" }}>
              <div className="b-ico"><Icon name="spark" size={20} /></div>
              <h4>Follow the craft</h4>
              <p>@silaistudio</p>
              <div className="socials">
                <button className="pip" title="Instagram"><Icon name="camera" size={16} /></button>
                <button className="pip" title="WhatsApp"><Icon name="phone" size={15} /></button>
                <button className="pip" title="Email"><Icon name="mail" size={15} /></button>
              </div>
            </div>
          </div>
        </section>

        <footer className="sc-foot">
          <span>© {new Date().getFullYear()} Silaai Studio · Crafted with care.</span>
          <span>{loggedIn ? "" : "Family portal · sign in with your phone number"}</span>
        </footer>
      </div>
    </div>
  );
}
