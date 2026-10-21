"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import type {ComponentPropsWithRef} from "react";
import {buttonClassName, type ButtonSize} from "@/components/ui";
import {cn} from "@/lib/cn";

export interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SegmentedControlProps = Omit<ComponentPropsWithRef<typeof ToggleGroup.Root>, "type" | "children" | "defaultValue" | "value" | "onValueChange"> & {
  "aria-label": string;
  options: readonly SegmentOption[];
  value: string;
  onValueChange: (value: string) => void;
  size?: Exclude<ButtonSize, "icon">;
};

/** A required single choice with Radix roving focus, arrow keys and Home/End. */
export function SegmentedControl({options, value, onValueChange, size = "sm", className, ...props}: SegmentedControlProps) {
  return (
    <ToggleGroup.Root {...props} type="single" data-slot="segmented-control" className={cn("inline-flex flex-wrap gap-control-gap", className)} value={value} onValueChange={next => {if (next) onValueChange(next);}}>
      {options.map(option => (
        <ToggleGroup.Item data-slot="button" data-variant="ghost" data-size={size} className={buttonClassName({variant: "ghost", size})} key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
