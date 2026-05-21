"use client";

import {useState} from "react";
import type {ReactNode} from "react";

interface MobileHeaderShellProps {
  children: ReactNode;
}

export function MobileHeaderShell({children}: MobileHeaderShellProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`mobile-header-shell${isExpanded ? " mobile-header-shell--expanded" : ""}`}>
      <button
        aria-expanded={isExpanded}
        className="mobile-header-shell__toggle"
        onClick={() => {
          setIsExpanded((currentValue) => !currentValue);
        }}
        type="button"
      >
        <span className="mobile-header-shell__toggle-label">Menu</span>
        <span aria-hidden="true" className="mobile-header-shell__toggle-icon">
          {isExpanded ? "−" : "+"}
        </span>
      </button>
      <div className="mobile-header-shell__content">{children}</div>
    </div>
  );
}
