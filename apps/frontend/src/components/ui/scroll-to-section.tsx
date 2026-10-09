"use client";
import { useEffect, useRef, type ComponentProps } from "react";
import { scrollToSection } from "./smooth-scroll";

type Props = Omit<ComponentProps<"button">, "onClick" | "type"> & {
  targetId: string;
  focusTarget?: boolean;
};

export function ScrollToSection({ targetId, focusTarget = false, className, ...props }: Props) {
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), []);
  return (
    <button
      {...props}
      type="button"
      className={`rs-scroll-link${className ? ` ${className}` : ""}`}
      onClick={() => {
        cancel.current = scrollToSection(targetId, focusTarget);
      }}
    />
  );
}
