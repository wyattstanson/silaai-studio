import type { ButtonHTMLAttributes, CSSProperties, ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useEffect } from "react";
import "./ui.css";

/* ---- Button -------------------------------------------------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "md" | "sm";
};
export function Button({ variant = "default", size = "md", className = "", ...p }: BtnProps) {
  const v = variant === "primary" ? "btn-primary" : variant === "ghost" ? "btn-ghost" : variant === "danger" ? "btn-danger" : "";
  return <button className={`btn ${v} ${size === "sm" ? "btn-sm" : ""} ${className}`} {...p} />;
}

/* ---- Card ---------------------------------------------------- */
export function Card({ children, className = "", pad = false, style }: { children: ReactNode; className?: string; pad?: boolean; style?: CSSProperties }) {
  return <div className={`card ${pad ? "card-pad" : ""} ${className}`} style={style}>{children}</div>;
}

/* ---- Badge --------------------------------------------------- */
type Tone = "neutral" | "ok" | "warn" | "urgent" | "info" | "plum";
export function Badge({ children, tone = "neutral", dot }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  const cls = tone === "neutral" ? "" : `badge-${tone}`;
  return <span className={`badge ${cls}`}>{dot && <span className="dot" />}{children}</span>;
}

/* ---- Stat ---------------------------------------------------- */
export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="stat">
      <div className="lbl">{icon && <span className="ico">{icon}</span>}{label}</div>
      <div className="val tnum">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

/* ---- Segmented control -------------------------------------- */
export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="tablist">
      {options.map(o => (
        <button key={o.value} role="tab" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---- Fields -------------------------------------------------- */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}
export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) { return <input className={"input" + (className ? " " + className : "")} {...p} />; }
export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="textarea" {...p} />; }
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) { return <select className="select" {...p} />; }

/* ---- Avatar -------------------------------------------------- */
export function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="avatar" aria-hidden>{initials}</div>;
}

/* ---- Modal --------------------------------------------------- */
export function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="sheet" onMouseDown={e => e.stopPropagation()}>
        <div className="sheet-hd">
          <h3>{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">✕</Button>
        </div>
        <div className="sheet-bd">{children}</div>
        {footer && <div className="sheet-ft">{footer}</div>}
      </div>
    </div>
  );
}

/* ---- Empty state -------------------------------------------- */
export function Empty({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="empty">
      {icon && <div className="big">{icon}</div>}
      <div style={{ fontWeight: 600, color: "var(--text-soft)" }}>{title}</div>
      {hint && <div style={{ fontSize: 13 }}>{hint}</div>}
    </div>
  );
}

/* ---- Progress rail ------------------------------------------ */
export function Rail({ pct }: { pct: number }) {
  return <div className="rail"><span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>;
}
