"use client";

/**
 * Motion primitives for the Neo-Local Bold system.
 * Restrained micro-interactions: short ease-out entrances, single-property
 * hovers, nothing continuous or springy. All respect prefers-reduced-motion
 * via CSS (globals.css) + useReducedMotion.
 */

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

/* ── Reveal: gentle fade-up on first scroll into view ────────── */
export function Reveal({
  children,
  delay = 0,
  y = 10,
  once = true,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
  className?: string;
  as?: "div" | "section" | "span" | "li" | "p";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Comp>
  );
}

/* ── Stagger container + child item ───────────────────────────── */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

/* ── Sticker: rotated label with a subtle single-property hover ─ */
export function Sticker({
  children,
  tone = "ember",
  rotate = -3,
  className,
}: {
  children: ReactNode;
  tone?: "ember" | "amber" | "cream";
  rotate?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={cn("sticker", `sticker-${tone}`, className)}
      style={{ rotate: `${rotate}deg` }}
      whileHover={
        reduce
          ? undefined
          : {
              scale: 1.03,
              transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
            }
      }
    >
      {children}
    </motion.span>
  );
}

/* ── HoverLift: subtle single-property lift for interactive cards ─ */
export function HoverLift({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      whileHover={
        reduce
          ? undefined
          : { y: -3, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }
      }
      whileTap={reduce ? undefined : { scale: 0.98 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
