import { useRef, useState, type ReactNode } from "react";

/**
 * Windowed list — renders only the rows in view (plus overscan), so a
 * table of tens of thousands stays at a few dozen DOM nodes. Fixed row height.
 */
export function VirtualList<T>({
  items, rowHeight, height, overscan = 8, renderRow, className,
}: {
  items: T[];
  rowHeight: number;
  height: number;
  overscan?: number;
  renderRow: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const ticking = useRef(false);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => { setScrollTop(top); ticking.current = false; });
  };

  const total = items.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(items.length, Math.ceil((scrollTop + height) / rowHeight) + overscan);
  const slice = [];
  for (let i = start; i < end; i++) {
    slice.push(
      <div key={i} style={{ position: "absolute", top: i * rowHeight, left: 0, right: 0, height: rowHeight }}>
        {renderRow(items[i], i)}
      </div>
    );
  }

  return (
    <div className={className} style={{ height, overflowY: "auto", overflowX: "hidden" }} onScroll={onScroll}>
      <div style={{ height: total, position: "relative" }}>{slice}</div>
    </div>
  );
}
