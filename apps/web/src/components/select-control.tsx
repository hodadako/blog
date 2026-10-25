"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import type {ComponentPropsWithRef} from "react";
import {Button} from "@/components/ui";
import {cn} from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectControlProps = Omit<ComponentPropsWithRef<typeof SelectPrimitive.Trigger>, "children" | "value" | "defaultValue" | "onChange"> & {
  "aria-label": string;
  options: readonly SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  required?: boolean;
  form?: string;
};

/** Single value selection with the same trigger and menu styles as LocaleSwitcher. */
export function SelectControl({options, value, onValueChange, disabled, name, required, form, className, ...triggerProps}: SelectControlProps) {
  const label = options.find(option => option.value === value)?.label;

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled} name={name} required={required} form={form}>
      <SelectPrimitive.Trigger asChild {...triggerProps}>
        <Button variant="outline" size="sm" className={cn("dropdown-trigger dropdown-trigger--stretch", className)} data-value={value}>
          <SelectPrimitive.Value>{label}</SelectPrimitive.Value>
        </Button>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" align="start" aria-label={triggerProps["aria-label"]} className="dropdown-content dropdown-content--select">
          <SelectPrimitive.Viewport className="dropdown-viewport">
            {options.map(option => (
              <SelectPrimitive.Item key={option.value} value={option.value} data-value={option.value} textValue={option.label} disabled={option.disabled} className="dropdown-item">
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator aria-hidden="true" className="dropdown-indicator">•</SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
