import NextLink from "next/link";
import type {ComponentPropsWithRef} from "react";
import {buttonClassName, type ButtonAppearance} from "@/components/ui";

/** Next routing stays separate so primitives also work in the Vite song editor. */
export type UiLinkProps<T extends string = string> = ComponentPropsWithRef<typeof NextLink<T>> & ButtonAppearance & {appearance?: "text" | "button"};

export function UiLink<T extends string>({appearance = "text", variant, size, className = "", ...props}: UiLinkProps<T>) {
  return <NextLink {...props} className={appearance === "button" ? buttonClassName({variant, size, className}) : `text-link ${className}`.trim()} />;
}
