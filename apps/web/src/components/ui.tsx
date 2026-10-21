import type {ComponentPropsWithRef} from "react";
import {buttonVariants, selectedControlClasses, type ButtonVariant, type ButtonSize} from "@/design-system/control-variants";
import {cn} from "@/lib/cn";

export type {ButtonVariant, ButtonSize} from "@/design-system/control-variants";

export interface ButtonAppearance {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Also used by navigation links without changing their anchor semantics. */
export function buttonClassName({variant = "primary", size = "md", className}: ButtonAppearance = {}): string {
  return cn(buttonVariants({variant, size}), selectedControlClasses, className);
}

export type ButtonProps = ComponentPropsWithRef<"button"> & ButtonAppearance;

export function Button({variant = "primary", size = "md", className, type = "button", ...props}: ButtonProps) {
  return <button data-slot="button" data-variant={variant} data-size={size} {...props} type={type} className={buttonClassName({variant, size, className})} />;
}

export type IconButtonProps = Omit<ButtonProps, "size"> & {"aria-label": string};

export function IconButton(props: IconButtonProps) {
  return <Button {...props} size="icon" />;
}

export type ToggleButtonProps = Omit<ButtonProps, "aria-pressed"> & {pressed: boolean};

/** Controlled state; callers retain their native click handlers and storage policy. */
export function ToggleButton({pressed, variant = "ghost", ...props}: ToggleButtonProps) {
  return <Button {...props} variant={variant} aria-pressed={pressed} />;
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
