"use client";

import { useState } from "react";
import type { QuizOption } from "@/lib/types";

/** Domain radio cards; preserve quiz image layout rather than applying Button geometry. */
export function QuizOptions({
  options,
  value,
  onValueChange,
  label,
  imageChoices = false,
}: {
  options: readonly QuizOption[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  imageChoices?: boolean;
}) {
  const [imageFailures, setImageFailures] = useState<Set<string>>(new Set());
  return (
    <div
      className={
        imageChoices ? "quiz-options quiz-options--image" : "quiz-options"
      }
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option, index) => {
        const failed = imageFailures.has(option.id);
        const optionText = option.label ?? option.text;
        return (
          <button
            aria-checked={value === option.id}
            aria-label={optionText ?? option.altText ?? `${label} ${index + 1}`}
            className={
              value === option.id
                ? "quiz-option quiz-option--selected"
                : "quiz-option"
            }
            key={option.id}
            onClick={() => onValueChange(option.id)}
            role="radio"
            tabIndex={value === option.id || (!value && index === 0) ? 0 : -1}
            onKeyDown={(event) => {
              const direction =
                event.key === "ArrowRight" || event.key === "ArrowDown"
                  ? 1
                  : event.key === "ArrowLeft" || event.key === "ArrowUp"
                    ? -1
                    : 0;
              if (!direction) return;
              event.preventDefault();
              const nextIndex =
                (index + direction + options.length) % options.length;
              onValueChange(options[nextIndex].id);
              const radios = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
              radios?.[nextIndex]?.focus();
            }}
            type="button"
          >
            {option.imageUrl && !failed ? (
              <img
                alt={option.altText ?? option.label ?? `${label} ${index + 1}`}
                className="quiz-option__image"
                loading="lazy"
                onError={() =>
                  setImageFailures((current) => new Set(current).add(option.id))
                }
                src={option.imageUrl}
              />
            ) : null}
            <span className="quiz-option__caption">
              <span aria-hidden="true" className="quiz-option__number">
                {index + 1}
              </span>
              {optionText ? (
                <span className="quiz-option__label">{optionText}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
