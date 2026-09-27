"use client";

import type {Route} from "next";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect, useRef, type MouseEvent} from "react";
import type {RecordItem} from "@/lib/records";
import type {getDictionary} from "@/lib/site";
import {navigateWithRecordsTransition, settleRecordsNavigation} from "./records-transition";

interface RecordViewProps {
  item: RecordItem;
  index: number;
  total: number;
  backHref: Route;
  previousHref?: Route;
  nextHref?: Route;
  labels: ReturnType<typeof getDictionary>["recordsPage"];
}

export function RecordView({item, index, total, backHref, previousHref, nextHref, labels}: RecordViewProps) {
  const router = useRouter();
  const zoomRef = useRef<HTMLDialogElement>(null);
  const artworkButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    settleRecordsNavigation();
  }, [item.id]);

  function navigate(direction: "previous" | "next", href: Route): void {
    document.documentElement.dataset.recordsDirection = direction;
    const transition = navigateWithRecordsTransition("detail", () => router.replace(href));

    if (transition) {
      const clear = (): void => {
        delete document.documentElement.dataset.recordsDirection;
      };
      transition.finished.then(clear, clear);
    } else {
      delete document.documentElement.dataset.recordsDirection;
      router.replace(href);
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || zoomRef.current?.open) {
        return;
      }

      if (event.key === "ArrowLeft" && previousHref) {
        event.preventDefault();
        navigate("previous", previousHref);
      } else if (event.key === "ArrowRight" && nextHref) {
        event.preventDefault();
        navigate("next", nextHref);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previousHref, nextHref]);

  function closeZoom(): void {
    zoomRef.current?.close();
  }

  function handleNavigationClick(event: MouseEvent<HTMLAnchorElement>, direction: "previous" | "next", href: Route): void {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    navigate(direction, href);
  }

  const position = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const dateLabel = item.publishedOn.slice(0, 7).replace("-", ".");
  const linkHost = new URL(item.href).hostname.replace(/^www\./, "");

  return (
    <article className="page-main record-view">
      <div className="record-view__topline">
        <Link className="record-view__back" href={backHref} replace scroll={false}>
          {labels.backLabel}
        </Link>
        <span className="record-view__index">{position}</span>
      </div>

      <div className="record-view__layout">
        <button
          aria-label={labels.zoomLabel.replace("{title}", item.title)}
          className="record-view__art-button"
          disabled={!item.imageUrl}
          onClick={() => zoomRef.current?.showModal()}
          ref={artworkButtonRef}
          type="button"
        >
          {item.imageUrl ? (
            <img alt={item.title} className="record-view__art" height="400" src={item.imageUrl} width="400" />
          ) : (
            <span className="record-view__art record-view__art--placeholder">{labels.types[item.type]}</span>
          )}
        </button>

        <div className="record-view__content">
          <p className="record-view__meta">
            {labels.types[item.type]} · <time dateTime={item.publishedOn}>{dateLabel}</time>
          </p>
          <h1 className="record-view__title">{item.title}</h1>
          <p className="record-view__source">{item.source}</p>
          {item.summary ? <p className="record-view__summary">{item.summary}</p> : null}
          <a
            aria-label={`${linkHost} · ${labels.externalLinkLabel}`}
            className="record-view__external"
            href={item.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {linkHost}
          </a>
        </div>
      </div>

      <nav aria-label={labels.recordNavigationLabel} className="record-view__navigation">
        {previousHref ? (
          <Link href={previousHref} onClick={(event) => handleNavigationClick(event, "previous", previousHref)} replace>
            {labels.previousLabel}
          </Link>
        ) : <span aria-disabled="true">{labels.previousLabel}</span>}
        {nextHref ? (
          <Link href={nextHref} onClick={(event) => handleNavigationClick(event, "next", nextHref)} replace>
            {labels.nextLabel}
          </Link>
        ) : <span aria-disabled="true">{labels.nextLabel}</span>}
      </nav>

      <dialog
        aria-label={labels.zoomViewerLabel}
        className="record-zoom"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeZoom();
          }
        }}
        onClose={() => artworkButtonRef.current?.focus()}
        ref={zoomRef}
      >
        <button aria-label={labels.closeLabel} className="record-zoom__close" onClick={closeZoom} type="button">×</button>
        {item.imageUrl ? <img alt={item.title} className="record-zoom__image" src={item.imageUrl} /> : null}
      </dialog>
    </article>
  );
}
