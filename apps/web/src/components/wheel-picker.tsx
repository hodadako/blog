"use client";

import {useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent} from "react";

export interface WheelPickerOption {
  value: string;
  label: string;
}

export interface WheelPickerProps {
  label: string;
  options: readonly WheelPickerOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

/** One ordered column. Compose columns for dates/time; values never loop. */
export function WheelPicker({label, options, value, onValueChange, disabled = false}: WheelPickerProps) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{startY: number; startTop: number; optionIndex: number | null} | null>(null);
  const suppressClick = useRef(false);
  const selectedIndex = options.findIndex(option => option.value === value);
  const [previewIndex, setPreviewIndex] = useState(selectedIndex);
  const unavailable = disabled || options.length === 0;

  function itemHeight(): number {
    return viewport.current?.querySelector<HTMLElement>("[role=option]")?.offsetHeight ?? 0;
  }

  function nearestIndex(): number {
    const height = itemHeight();
    return height > 0 ? Math.max(0, Math.min(options.length - 1, Math.round((viewport.current?.scrollTop ?? 0) / height))) : -1;
  }

  function align(index: number, smooth: boolean): void {
    const height = itemHeight();
    if (height === 0 || index < 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.current?.scrollTo({top: index * height, behavior: smooth && !reduceMotion ? "smooth" : "instant"});
  }

  useEffect(() => {
    const element = viewport.current;
    const height = element?.querySelector<HTMLElement>("[role=option]")?.offsetHeight ?? 0;
    if (element && selectedIndex >= 0) element.scrollTop = selectedIndex * height;
    setPreviewIndex(selectedIndex);
  }, [selectedIndex, options.length]);

  useEffect(() => () => {if (timer.current) clearTimeout(timer.current);}, []);

  useEffect(() => {
    if (disabled && timer.current) clearTimeout(timer.current);
  }, [disabled]);

  function onScroll(): void {
    if (unavailable) return;
    const index = nearestIndex();
    setPreviewIndex(index);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (drag.current) return;
      const settled = nearestIndex();
      if (settled < 0) return;
      align(settled, false);
      const next = options[settled];
      if (next && next.value !== value) onValueChange(next.value);
    }, 160);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (unavailable) return;
    let next = selectedIndex;
    if (event.key === "ArrowDown") next += 1;
    else if (event.key === "ArrowUp") next -= 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    next = Math.max(0, Math.min(options.length - 1, next));
    if (options[next] && options[next].value !== value) onValueChange(options[next].value);
    align(next, false);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    suppressClick.current = false;
    if (unavailable || event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.scrollSnapType = "none";
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-option-index]") : null;
    drag.current = {startY: event.clientY, startTop: event.currentTarget.scrollTop, optionIndex: target ? Number(target.dataset.optionIndex) : null};
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!drag.current) return;
    const delta = event.clientY - drag.current.startY;
    if (Math.abs(delta) > 6) suppressClick.current = true;
    event.currentTarget.scrollTop = drag.current.startTop - delta;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>): void {
    if (!drag.current) return;
    const clickedIndex = !suppressClick.current ? drag.current.optionIndex : null;
    drag.current = null;
    event.currentTarget.style.scrollSnapType = "";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    align(clickedIndex ?? nearestIndex(), true);
    onScroll();
  }

  return (
    <div className="wheel-picker" data-disabled={unavailable || undefined}>
      <div aria-hidden="true" className="wheel-picker__indicator" />
      <div
        aria-activedescendant={selectedIndex >= 0 ? `${id}-${selectedIndex}` : undefined}
        aria-disabled={unavailable}
        aria-label={label}
        className="wheel-picker__viewport"
        onKeyDown={onKeyDown}
        onPointerCancel={endDrag}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onScroll={onScroll}
        ref={viewport}
        role="listbox"
        tabIndex={unavailable ? -1 : 0}
      >
        <div aria-hidden="true" className="wheel-picker__spacer" />
        {options.map((option, index) => (
          <div
            aria-selected={index === selectedIndex}
            className="wheel-picker__option"
            data-option-index={index}
            data-current={index === previewIndex || undefined}
            id={`${id}-${index}`}
            key={option.value}
            onClick={() => {if (!unavailable && !suppressClick.current) align(index, true);}}
            role="option"
          >
            {option.label}
          </div>
        ))}
        <div aria-hidden="true" className="wheel-picker__spacer" />
      </div>
    </div>
  );
}
