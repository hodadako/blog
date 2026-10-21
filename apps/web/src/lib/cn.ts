import {clsx, type ClassValue} from "clsx";
import {extendTailwindMerge} from "tailwind-merge";

const merge = extendTailwindMerge({extend: {theme: {
  text: ["control", "control-sm"],
  font: ["interface"],
  "font-weight": ["control"],
  spacing: ["control-sm", "control-md", "control-lg", "control-x-sm", "control-x", "control-x-lg", "control-y", "control-gap"],
}}});

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
