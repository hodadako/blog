"use client";

import {useEffect, useId, useRef, useState} from "react";
import {usePathname} from "next/navigation";
import type {ReactNode} from "react";
import {Button} from "@/components/ui";

interface MobileHeaderShellProps {
  children: ReactNode;
  menuLabel: string;
}

export function MobileHeaderShell({children, menuLabel}: MobileHeaderShellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => { setIsExpanded(false); }, [pathname]);

  return (
    <div
      className={`mobile-header-shell${isExpanded ? " mobile-header-shell--expanded" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isExpanded && !event.defaultPrevented) {
          setIsExpanded(false);
          toggleRef.current?.focus();
        }
      }}
      onClick={(event) => {
        if ((event.target as Element).closest("a")) setIsExpanded(false);
      }}
    >
      <Button variant="outline" size="sm"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        ref={toggleRef}
        className="mobile-header-shell__toggle"
        onClick={() => {
          setIsExpanded((currentValue) => !currentValue);
        }}
        type="button"
      >
        <span className="mobile-header-shell__toggle-label">{menuLabel}</span>
        <span aria-hidden="true" className="mobile-header-shell__toggle-icon">
          {isExpanded ? "−" : "+"}
        </span>
      </Button>
      <div className="mobile-header-shell__content" id={contentId}>{children}</div>
    </div>
  );
}
