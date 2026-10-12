import type {ButtonHTMLAttributes, InputHTMLAttributes, ReactNode} from "react";

export function Button({variant = "primary", className = "", ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {variant?: "primary" | "secondary" | "brand"}) {
  return <button {...props} className={`button${variant === "secondary" ? " button--secondary" : variant === "brand" ? " button--brand" : ""} ${className}`} />;
}

export function Input({className = "", ...props}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field__input ${className}`} />;
}

export function Tag({children}: {children: ReactNode}) {
  return <span className="pill">{children}</span>;
}

// Same implementation, named for the reusable design-system component.
export {Button as ActionButton};
