"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject} from "react";
import type {RecordItem} from "@/lib/records";
import type {AppLocale, RecordType} from "@/lib/site";
import {getCollectionScrollKey, getRecordHref} from "./records-navigation";
import {navigateWithRecordsTransition} from "./records-transition";

interface RecordsGridProps {
  collection: Array<RecordItem>;
  locale: AppLocale;
  filterType?: RecordType;
  typeLabels: Record<RecordType, string>;
}

interface RecordTileProps {
  item: RecordItem;
  index: number;
  locale: AppLocale;
  filterType?: RecordType;
  typeLabel: string;
  canTiltRef: RefObject<boolean>;
  onSelect: (event: MouseEvent<HTMLAnchorElement>, item: RecordItem, art: HTMLElement | null) => void;
}

const MAX_TILT_DEG = 1;
const MAX_ENTER_STAGGER_INDEX = 8;
const EAGER_TILE_COUNT = 6;

function useTiltCapability(): RefObject<boolean> {
  const canTiltRef = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = (): void => {
      canTiltRef.current = query.matches;
    };

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return canTiltRef;
}

function setTilt(element: HTMLElement, rotateX: number, rotateY: number): void {
  element.style.setProperty("--record-tilt-x", `${rotateX.toFixed(3)}deg`);
  element.style.setProperty("--record-tilt-y", `${rotateY.toFixed(3)}deg`);
}

function clampUnit(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function RecordTile({item, index, locale, filterType, typeLabel, canTiltRef, onSelect}: RecordTileProps) {
  const frameRef = useRef(0);
  const artRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>): void {
    if (event.pointerType !== "mouse" || !canTiltRef.current) {
      return;
    }

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const offsetX = clampUnit((event.clientX - rect.left) / rect.width) - 0.5;
    const offsetY = clampUnit((event.clientY - rect.top) / rect.height) - 0.5;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      setTilt(element, offsetY * 2 * MAX_TILT_DEG, -offsetX * 2 * MAX_TILT_DEG);
    });
  }

  function settleTilt(event: PointerEvent<HTMLAnchorElement>): void {
    cancelAnimationFrame(frameRef.current);
    setTilt(event.currentTarget, 0, 0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLAnchorElement>): void {
    if (event.key === " " && !event.repeat) {
      event.preventDefault();
      event.currentTarget.dataset.pressed = "true";
    }
  }

  function handleKeyUp(event: KeyboardEvent<HTMLAnchorElement>): void {
    if (event.key === " ") {
      event.preventDefault();
      delete event.currentTarget.dataset.pressed;
      event.currentTarget.click();
    }
  }

  const tileStyle = {
    viewTransitionName: `record-${item.id}`,
    "--record-index": Math.min(index, MAX_ENTER_STAGGER_INDEX),
  } as CSSProperties;

  return (
    <li className="record-tile" style={tileStyle}>
      <Link
        className="record-tile__button"
        href={getRecordHref(locale, item, filterType)}
        onClick={(event) => onSelect(event, item, artRef.current)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={(event) => delete event.currentTarget.dataset.pressed}
        onPointerCancel={settleTilt}
        onPointerDown={settleTilt}
        onPointerLeave={settleTilt}
        onPointerMove={handlePointerMove}
      >
        <span className="record-tile__frame">
          {item.imageUrl ? (
            <img
              alt=""
              className="record-tile__art"
              decoding="async"
              draggable={false}
              height="400"
              loading={index < EAGER_TILE_COUNT ? "eager" : "lazy"}
              ref={(element) => { artRef.current = element; }}
              src={item.imageUrl}
              width="400"
            />
          ) : (
            <span aria-hidden="true" className="record-tile__art record-tile__art--placeholder" ref={(element) => { artRef.current = element; }}>
              {typeLabel}
            </span>
          )}
        </span>
        <span className="record-tile__title">{item.title}</span>
      </Link>
    </li>
  );
}

export function RecordsGrid({collection, locale, filterType, typeLabels}: RecordsGridProps) {
  const router = useRouter();
  const canTiltRef = useTiltCapability();

  useEffect(() => {
    const key = getCollectionScrollKey(locale, filterType);
    const saved = window.sessionStorage.getItem(key);

    if (!saved) {
      return;
    }

    const position = Number(saved);
    if (!Number.isFinite(position)) {
      window.sessionStorage.removeItem(key);
      return;
    }

    const timer = window.setTimeout(() => {
      window.scrollTo({top: position, behavior: "instant"});
      window.sessionStorage.removeItem(key);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [locale, filterType]);

  function selectRecord(event: MouseEvent<HTMLAnchorElement>, item: RecordItem, art: HTMLElement | null): void {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    window.sessionStorage.setItem(getCollectionScrollKey(locale, filterType), String(window.scrollY));
    if (art) {
      art.style.viewTransitionName = "record-art";
    }

    const transition = navigateWithRecordsTransition("detail", () => router.push(getRecordHref(locale, item, filterType)));
    if (transition) {
      event.preventDefault();
      const clearArtName = (): void => {
        if (art) {
          art.style.viewTransitionName = "";
        }
      };
      transition.finished.then(clearArtName, clearArtName);
    } else if (art) {
      art.style.viewTransitionName = "";
    }
  }

  return (
    <ul className="records-grid">
      {collection.map((item, index) => (
        <RecordTile
          canTiltRef={canTiltRef}
          filterType={filterType}
          index={index}
          item={item}
          key={item.id}
          locale={locale}
          onSelect={selectRecord}
          typeLabel={typeLabels[item.type]}
        />
      ))}
    </ul>
  );
}
