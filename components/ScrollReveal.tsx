"use client";

import type { CSSProperties, ReactNode } from "react";
import { useScrollReveal } from "@/components/useScrollReveal";

type ScrollRevealProps = {
  as?: "section" | "div";
  id?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function ScrollReveal({
  as = "section",
  id,
  className = "",
  style,
  children,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();
  const Tag = as;
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };

  return (
    <Tag
      ref={setRef}
      id={id}
      className={`scroll-reveal ${isVisible ? "is-visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
