import type {ComponentPropsWithRef} from "react";

export type ButtonVariant = "primary" | "secondary" | "brand" | "quiet";
export type ButtonSize = "default" | "compact";

export interface ButtonAppearance {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Also used by navigation links without changing their anchor semantics. */
export function buttonClassName({variant = "primary", size = "default", className = ""}: ButtonAppearance = {}): string {
  return ["button", variant !== "primary" && `button--${variant}`, size !== "default" && `button--${size}`, className].filter(Boolean).join(" ");
}

export type ButtonProps = ComponentPropsWithRef<"button"> & ButtonAppearance;

export function Button({variant, size, className, type = "button", ...props}: ButtonProps) {
  return <button {...props} type={type} className={buttonClassName({variant, size, className})} />;
}

interface FieldAppearance {
  appearance?: "filled" | "outline";
  density?: "default" | "compact";
}

function fieldClassName(base: string, appearance: FieldAppearance["appearance"], density: FieldAppearance["density"], className?: string): string {
  return [base, appearance === "outline" && "field--outline", density === "compact" && "field--compact", className].filter(Boolean).join(" ");
}

export type InputProps = ComponentPropsWithRef<"input"> & FieldAppearance;
export function Input({appearance, density, className, ...props}: InputProps) {
  return <input {...props} className={fieldClassName("field__input", appearance, density, className)} />;
}

export type TextareaProps = ComponentPropsWithRef<"textarea"> & FieldAppearance;
export function Textarea({appearance, density, className, ...props}: TextareaProps) {
  return <textarea {...props} className={fieldClassName("field__textarea", appearance, density, className)} />;
}

export type SelectProps = ComponentPropsWithRef<"select"> & FieldAppearance;
export function Select({appearance, density, className, ...props}: SelectProps) {
  return <select {...props} className={fieldClassName("field__select", appearance, density, className)} />;
}

export function Tag({className = "", ...props}: ComponentPropsWithRef<"span">) {
  return <span {...props} className={`pill ${className}`.trim()} />;
}

export function TextLink({className = "", ...props}: ComponentPropsWithRef<"a">) {
  return <a {...props} className={`text-link ${className}`.trim()} />;
}

export type EmptyStateProps = ComponentPropsWithRef<"p"> & {appearance?: "plain" | "panel"};
export function EmptyState({appearance = "plain", className = "", ...props}: EmptyStateProps) {
  return <p {...props} className={`${appearance === "panel" ? "empty-state" : "empty-message"} ${className}`.trim()} />;
}

// Same implementation, named for the reusable design-system component.
export {Button as ActionButton};
