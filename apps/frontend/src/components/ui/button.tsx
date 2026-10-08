import type { ButtonHTMLAttributes } from "react";
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "light" | "warm" | "ghost" }) {
  return (
    <button {...props} type={type} className={`rs-button ${className}`} data-variant={variant} />
  );
}
