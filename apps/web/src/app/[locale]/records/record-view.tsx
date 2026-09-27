"use client";

import type {Route} from "next";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent} from "react";
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

type RecordTab = "detail" | "profile";

export function RecordView({item, index, total, backHref, previousHref, nextHref, labels}: RecordViewProps) {
  const router = useRouter();
  const zoomRef = useRef<HTMLDialogElement>(null);
  const artworkButtonRef = useRef<HTMLButtonElement>(null);
  const detailTabRef = useRef<HTMLButtonElement>(null);
  const profileTabRef = useRef<HTMLButtonElement>(null);
  const [tab, setTab] = useState<RecordTab>("detail");
  const [spinning, setSpinning] = useState(false);
  const tabId = useId();

  useEffect(() => {
    settleRecordsNavigation();
    setTab("detail");
    setSpinning(false);
  }, [item.id]);

  function navigate(direction: "previous" | "next", href: Route): void {
    setSpinning(false);
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
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || zoomRef.current?.open ||
        (event.target instanceof Element && event.target.closest('[role="tablist"]'))) {
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

  function handleTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    event.preventDefault();
    const nextTab = event.key === "Home" || event.key === "ArrowLeft" ? "detail" : "profile";
    setTab(nextTab);
    (nextTab === "detail" ? detailTabRef : profileTabRef).current?.focus();
  }

  const position = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const dateLabel = item.publishedOn.slice(0, 7).replace("-", ".");
  const linkHost = new URL(item.href).hostname.replace(/^www\./, "");

  return (
    <article className="page-main record-view">
      <div className="record-view__topline">
        <Link className="record-view__back" href={backHref} replace scroll={false}>{labels.backLabel}</Link>
        <span className="record-view__index">{position}</span>
      </div>

      <div aria-labelledby={`${tabId}-${tab}`} className="record-view__layout" id={`${tabId}-panel`} role="tabpanel" tabIndex={0}>
        {tab === "detail" ? (
          <div className="record-view__visual">
            <button
              aria-label={labels.zoomLabel.replace("{title}", item.title)}
              className="record-view__art-button record-frame"
              disabled={!item.imageUrl}
              onClick={() => zoomRef.current?.showModal()}
              ref={artworkButtonRef}
              type="button"
            >
              <span className="record-view__art-window">
                {item.imageUrl ? (
                  <img alt={item.title} className="record-view__art" height="400" src={item.imageUrl} width="400" />
                ) : (
                  <span className="record-view__art record-view__art--placeholder">{labels.types[item.type]}</span>
                )}
              </span>
            </button>
          </div>
        ) : (
          <div className={`record-profile__visual record-frame${spinning ? " record-profile__visual--playing" : ""}`}>
            <div className="record-profile__stage">
              <div aria-hidden="true" className="record-profile__disc">
                {item.imageUrl ? <img alt="" src={item.imageUrl} /> : <span>{labels.types[item.type]}</span>}
                <span className="record-profile__center" />
              </div>
              <span aria-hidden="true" className="record-profile__note record-profile__note--one">♪</span>
              <span aria-hidden="true" className="record-profile__note record-profile__note--two">♫</span>
              <span aria-hidden="true" className="record-profile__note record-profile__note--three">♪</span>
            </div>
          </div>
        )}

        <div className="record-view__content">
          <p className="record-view__meta">
            {labels.types[item.type]} · <time dateTime={item.publishedOn}>{dateLabel}</time>
          </p>
          <h1 className="record-view__title">{item.title}</h1>
          <p className="record-view__source">{item.source}</p>
          {tab === "detail" ? (
            <>
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
            </>
          ) : (
            <div className="record-profile__controls">
              <button aria-pressed={spinning} className="record-profile__play" onClick={() => setSpinning((value) => !value)} type="button">
                <span aria-hidden="true">{spinning ? "Ⅱ" : "▶"}</span>
                {spinning ? labels.stopDiscLabel : labels.spinDiscLabel}
              </button>
              <a aria-label={`${linkHost} · ${labels.externalLinkLabel}`} className="record-view__external" href={item.href} rel="noopener noreferrer" target="_blank">
                {linkHost}
              </a>
            </div>
          )}
        </div>
      </div>

      <nav aria-label={labels.recordNavigationLabel} className="record-view__navigation">
        {previousHref ? (
          <Link href={previousHref} onClick={(event) => handleNavigationClick(event, "previous", previousHref)} replace>{labels.previousLabel}</Link>
        ) : <span aria-disabled="true">{labels.previousLabel}</span>}
        <div aria-label={labels.tabNavigationLabel} className="record-view__tabs" role="tablist">
          <button
            aria-controls={`${tabId}-panel`}
            aria-selected={tab === "detail"}
            id={`${tabId}-detail`}
            onClick={() => { setTab("detail"); setSpinning(false); }}
            onKeyDown={handleTabKeyDown}
            ref={detailTabRef}
            role="tab"
            tabIndex={tab === "detail" ? 0 : -1}
            type="button"
          >{labels.detailTabLabel}</button>
          <button
            aria-controls={`${tabId}-panel`}
            aria-selected={tab === "profile"}
            id={`${tabId}-profile`}
            onClick={() => setTab("profile")}
            onKeyDown={handleTabKeyDown}
            ref={profileTabRef}
            role="tab"
            tabIndex={tab === "profile" ? 0 : -1}
            type="button"
          >{labels.profileTabLabel}</button>
        </div>
        {nextHref ? (
          <Link href={nextHref} onClick={(event) => handleNavigationClick(event, "next", nextHref)} replace>{labels.nextLabel}</Link>
        ) : <span aria-disabled="true">{labels.nextLabel}</span>}
      </nav>

      <dialog
        aria-label={labels.zoomViewerLabel}
        className="record-zoom"
        onClick={(event) => { if (event.target === event.currentTarget) closeZoom(); }}
        onClose={() => artworkButtonRef.current?.focus()}
        ref={zoomRef}
      >
        <button aria-label={labels.closeLabel} className="record-zoom__close" onClick={closeZoom} type="button">×</button>
        {item.imageUrl ? <img alt={item.title} className="record-zoom__image" src={item.imageUrl} /> : null}
      </dialog>
    </article>
  );
}
