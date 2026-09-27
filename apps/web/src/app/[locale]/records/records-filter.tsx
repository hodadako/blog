"use client";

import type {Route} from "next";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useEffect, type MouseEvent} from "react";
import {startRecordsTransition} from "./records-transition";

export interface RecordsFilterItem {
  key: string;
  href: Route;
  label: string;
  active: boolean;
}

interface RecordsFilterProps {
  label: string;
  items: Array<RecordsFilterItem>;
}

const NAVIGATION_TIMEOUT_MS = 1500;

let pendingNavigation: {resolve: () => void; timer: number} | null = null;

function settlePendingNavigation(): void {
  if (!pendingNavigation) {
    return;
  }

  window.clearTimeout(pendingNavigation.timer);
  pendingNavigation.resolve();
  pendingNavigation = null;
}

export function RecordsFilter({label, items}: RecordsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    settlePendingNavigation();
  }, [pathname]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>, item: RecordsFilterItem): void {
    if (item.active || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const transition = startRecordsTransition(
      "filter",
      () =>
        new Promise<void>((resolve) => {
          settlePendingNavigation();
          pendingNavigation = {resolve, timer: window.setTimeout(settlePendingNavigation, NAVIGATION_TIMEOUT_MS)};
          router.push(item.href, {scroll: false});
        }),
    );

    if (transition) {
      event.preventDefault();
    }
  }

  return (
    <nav aria-label={label} className="records-filter">
      {items.map((item) => (
        <Link
          aria-current={item.active ? "page" : undefined}
          className={`records-filter__link${item.active ? " records-filter__link--active" : ""}`}
          href={item.href}
          key={item.key}
          onClick={(event) => handleClick(event, item)}
          scroll={false}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
