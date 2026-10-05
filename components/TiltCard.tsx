"use client";

import { useRef, type ReactNode } from "react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  max?: number;
  /** Show a moving light reflection. */
  glare?: boolean;
};

/**
 * 3D tilt that follows the mouse. Writes only CSS variables (no React re-renders),
 * throttled to one update per frame, and stays flat on touch screens or reduced motion.
 */
export function TiltCard({ children, className = "", max = 8, glare = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || frame.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      el.dataset.tilting = "true";
    });
  }

  function handleLeave() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    delete el.dataset.tilting;
  }

  return (
    <div className="tilt-scene">
      <div ref={ref} className={`tilt ${className}`} onPointerMove={handleMove} onPointerLeave={handleLeave}>
        {children}
        {glare && <span className="tilt-glare" aria-hidden="true" />}
      </div>
    </div>
  );
}
