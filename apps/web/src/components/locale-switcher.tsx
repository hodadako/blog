"use client";

import {useEffect, useId, useRef, useState} from "react";
import type {KeyboardEvent as ReactKeyboardEvent} from "react";
import {useRouter} from "next/navigation";
import {getDictionary, SUPPORTED_LOCALES, type AppLocale} from "@/lib/site";

interface LocaleSwitcherProps {
  currentLocale: AppLocale;
}

export function LocaleSwitcher({currentLocale}: LocaleSwitcherProps) {
  const dictionary = getDictionary(currentLocale);
  const router = useRouter();
  const labelId = useId();
  const triggerLabelId = useId();
  const menuId = useId();
  const switcherRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const localeOptions: Array<{label: string; locale: AppLocale}> = SUPPORTED_LOCALES.map((locale) => ({
    locale,
    label: dictionary.navigation.localeNames[locale],
  }));
  const currentIndex = localeOptions.findIndex(({locale}) => locale === currentLocale);

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
    optionRefs.current[index]?.focus();
  }

  function openMenuAndFocus(index: number): void {
    setIsOpen(true);

    requestAnimationFrame(() => {
      focusOption(index);
    });
  }

  function handleLocaleSelect(nextLocale: AppLocale): void {
    setIsOpen(false);

    if (nextLocale === currentLocale) {
      triggerRef.current?.focus();
      return;
    }

    router.push(`/${nextLocale}`);
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenuAndFocus(currentIndex >= 0 ? currentIndex : 0);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenuAndFocus(currentIndex >= 0 ? currentIndex : localeOptions.length - 1);
    }
  }

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption((index + 1) % localeOptions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption((index - 1 + localeOptions.length) % localeOptions.length);
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusOption(localeOptions.length - 1);
    }
  }

  return (
    <div
      className="locale-switcher"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
      ref={switcherRef}
    >
      <span className="sr-only" id={labelId}>
        {dictionary.navigation.languageLabel}
      </span>

      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-labelledby={`${labelId} ${triggerLabelId}`}
        className="locale-switcher__trigger"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="locale-switcher__trigger-label" id={triggerLabelId}>
          {dictionary.navigation.localeNames[currentLocale]}
        </span>
        <span aria-hidden="true" className="locale-switcher__chevron">
          ⌄
        </span>
      </button>

      {isOpen ? (
        <div aria-labelledby={labelId} className="locale-switcher__menu" id={menuId} role="menu">
          <ul className="locale-switcher__list">
            {localeOptions.map(({locale, label}, index) => {
              const isCurrent = locale === currentLocale;

              return (
                <li key={locale}>
                  <button
                    aria-checked={isCurrent}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`locale-switcher__option${isCurrent ? " locale-switcher__option--current" : ""}`}
                    onClick={() => {
                      handleLocaleSelect(locale);
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
                      <span aria-hidden="true" className="locale-switcher__current-marker">
                        •
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
