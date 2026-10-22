import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { notifyMascot } from "../lib/mascot-events";

type Position = { x: number; y: number };
let rememberedPosition: Position | null = null;

export default function DraggableMascot({ children }: { children: ReactNode }) {
  const dock = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);
  const suppressClick = useRef(false);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    left: number;
    top: number;
    lastX: number;
    moved: boolean;
  } | null>(null);

  function move(p: Position) {
    const rect = dock.current?.getBoundingClientRect();
    const next = {
      x: Math.max(8, Math.min(window.innerWidth - (rect?.width ?? 170) - 8, p.x)),
      y: Math.max(8, Math.min(window.innerHeight - (rect?.height ?? 200) - 8, p.y)),
    };
    rememberedPosition = next;
    setPosition(next);
  }

  function finish() {
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
    setDragging(false);
    notifyMascot({ type: "drag", active: false, velocityX: 0 });
  }

  useEffect(() => {
    if (rememberedPosition) move(rememberedPosition);
    const resize = () => {
      if (rememberedPosition) move(rememberedPosition);
    };
    const blur = () => finish();
    window.addEventListener("resize", resize);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", blur);
      notifyMascot({ type: "drag", active: false, velocityX: 0 });
    };
  }, []);

  function start(event: PointerEvent<HTMLElement>) {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      !(event.target as HTMLElement).closest("[data-bear-drag]")
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    suppressClick.current = false;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      lastX: event.clientX,
      moved: false,
    };
    // Capture on the button so a simple tap still opens the conversation.
    (event.target as HTMLElement).closest("[data-bear-drag]")?.setPointerCapture(event.pointerId);
  }

  return (
    <aside
      ref={dock}
      className={`bear-dock bear-dock-3d ${dragging ? "bear-dragging" : ""} ${position && position.y < 240 ? "bear-near-top" : ""}`}
      aria-label="Seu companheiro de estudos"
      style={
        position
          ? ({
              left: position.x,
              top: position.y,
              right: "auto",
              bottom: "auto",
              // Keep the wider dedication readable when the bear is dragged to the left edge.
              "--bear-bubble-shift": `${Math.max(0, Math.min(320, window.innerWidth - 24) - 170 + 8 - position.x)}px`,
            } as React.CSSProperties)
          : undefined
      }
      onPointerDown={start}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current || current.id !== event.pointerId) return;
        const dx = event.clientX - current.x,
          dy = event.clientY - current.y;
        if (!current.moved && Math.hypot(dx, dy) < 6) return;
        current.moved = true;
        setDragging(true);
        move({ x: current.left + dx, y: current.top + dy });
        notifyMascot({ type: "drag", active: true, velocityX: event.clientX - current.lastX });
        current.lastX = event.clientX;
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onClickCapture={(event) => {
        if (suppressClick.current && event.detail !== 0) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
      onKeyDown={(event) => {
        if (!(event.target as HTMLElement).matches("[data-bear-drag]")) return;
        if (event.key === "Escape") {
          rememberedPosition = null;
          setPosition(null);
          finish();
          return;
        }
        const offsets: Record<string, Position> = {
          ArrowLeft: { x: -20, y: 0 },
          ArrowRight: { x: 20, y: 0 },
          ArrowUp: { x: 0, y: -20 },
          ArrowDown: { x: 0, y: 20 },
        };
        const delta = offsets[event.key];
        if (!delta) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        move({ x: rect.left + delta.x, y: rect.top + delta.y });
        notifyMascot({ type: "drag", active: true, velocityX: delta.x });
      }}
      onKeyUp={finish}
      onBlur={finish}
    >
      {children}
      <span id="bear-drag-help" className="bear-drag-help">
        Arraste para brincar · toque para conversar
        <span className="sr-only">. Use as setas para mover e Escape para voltar ao canto.</span>
      </span>
    </aside>
  );
}
