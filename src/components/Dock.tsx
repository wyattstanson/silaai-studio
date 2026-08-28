import { Icon, type IconName } from "./Icon";
import "./Dock.css";

export interface DockItem {
  id: string;
  label: string;
  icon: IconName;
  tone?: "accent" | "sage" | "clay" | "neutral";
}

export function Dock({ items, utils, active, onSelect }: {
  items: DockItem[]; utils: DockItem[]; active: string; onSelect: (id: string) => void;
}) {
  const render = (it: DockItem) => (
    <button key={it.id} className="dock-item" data-tone={it.tone ?? "neutral"}
      aria-current={active === it.id ? "page" : undefined} onClick={() => onSelect(it.id)}>
      <span className="tip">{it.label}</span>
      <span className="dock-ico"><Icon name={it.icon} size={22} /></span>
      <span className="run" />
    </button>
  );
  return (
    <div className="dock-wrap">
      <div className="dock" role="toolbar" aria-label="Dock">
        {items.map(render)}
        <span className="sep" />
        {utils.map(render)}
      </div>
    </div>
  );
}
