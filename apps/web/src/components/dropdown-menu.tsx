"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Button } from "@/components/ui";

export interface MenuOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Single-choice action menu; routing remains the consumer's responsibility. */
export function DropdownMenu({
  label,
  options,
  value,
  onValueChange,
  className = "",
}: {
  label: string;
  options: readonly MenuOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const labelId = useId();
  const triggerLabelId = useId();
  const menuId = useId();
  const switcherRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const currentIndex = options.findIndex((option) => option.value === value);
  const currentLabel = options[currentIndex]?.label ?? value;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (switcherRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: globalThis.KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function focusOption(index: number): void {
    if (options[index]?.disabled) return;
    optionRefs.current[index]?.focus();
  }

  function nextEnabledIndex(index: number, direction: number): number {
    for (let step = 1; step <= options.length; step++) {
      const next = (index + direction * step + options.length) % options.length;
      if (!options[next].disabled) return next;
    }
    return -1;
  }

  function openMenuAndFocus(index: number): void {
    setIsOpen(true);

    requestAnimationFrame(() => {
      focusOption(index);
    });
  }

  function select(nextValue: string): void {
    setIsOpen(false);
    triggerRef.current?.focus();
    if (nextValue !== value) onValueChange(nextValue);
  }

  function handleTriggerKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenuAndFocus(currentIndex >= 0 ? currentIndex : 0);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenuAndFocus(currentIndex >= 0 ? currentIndex : options.length - 1);
    }
  }

  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(nextEnabledIndex(index, 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(nextEnabledIndex(index, -1));
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusOption(nextEnabledIndex(options.length - 1, 1));
    }

    if (event.key === "End") {
      event.preventDefault();
      focusOption(nextEnabledIndex(0, -1));
    }
  }

  return (
    <div
      className={`dropdown-menu ${className}`}
      onKeyDown={(event) => {
        if (isOpen && event.key === "Escape") {
          event.stopPropagation();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
      ref={switcherRef}
    >
      <span className="sr-only" id={labelId}>
        {label}
      </span>

      <Button
        variant="outline"
        size="sm"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-labelledby={`${labelId} ${triggerLabelId}`}
        className="dropdown-menu__trigger dropdown-trigger"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="dropdown-menu__trigger-label" id={triggerLabelId}>
          {currentLabel}
        </span>
      </Button>

      {isOpen ? (
        <div
          aria-labelledby={labelId}
          className="dropdown-menu__content dropdown-content"
          id={menuId}
          role="menu"
        >
          <ul className="dropdown-menu__list">
            {options.map(({ value: optionValue, label, disabled }, index) => {
              const isCurrent = optionValue === value;

              return (
                <li key={optionValue}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-checked={isCurrent}
                    aria-current={isCurrent ? "true" : undefined}
                    disabled={disabled}
                    className="dropdown-menu__option dropdown-item"
                    onClick={() => {
                      select(optionValue);
                    }}
                    onKeyDown={(event) => {
                      handleOptionKeyDown(event, index);
                    }}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    role="menuitemradio"
                    type="button"
                  >
                    <span>{label}</span>
                    {isCurrent ? (
                      <span aria-hidden="true" className="dropdown-indicator">
                        •
                      </span>
                    ) : null}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
