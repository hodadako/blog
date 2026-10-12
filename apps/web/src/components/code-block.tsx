"use client";

import {useEffect, useRef, useState} from "react";
import {codeToHtml} from "shiki";
import styles from "./code-block.module.css";
import type {AppLocale} from "@/lib/site";

interface CodeBlockProps {
  code: string;
  language: string;
  locale?: AppLocale;
}

export function CodeBlock({code, language, locale = "en"}: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void codeToHtml(code, {
      lang: language,
      themes: {light: "github-light-default", dark: "github-dark-default"},
      tabindex: false,
    }).then((html) => {
      if (!isCancelled) {
        setHighlightedHtml(html);
      }
    }).catch(() => {
      if (!isCancelled) {
        setHighlightedHtml(null);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [code, language]);

  async function handleCopy(): Promise<void> {
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    copyTimeout.current = setTimeout(() => setCopyStatus("idle"), 3000);
  }

  const copyLabel = locale === "ko" ? "복사" : "Copy";
  const copyMessage = copyStatus === "copied"
    ? locale === "ko" ? "복사됨" : "Copied"
    : copyStatus === "failed"
      ? locale === "ko" ? "복사 실패. 코드를 선택해 복사해 주세요." : "Copy failed. Select and copy the code."
      : "";

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.language}>{language}</span>
        <button className={styles.copyButton} onClick={() => { void handleCopy(); }} type="button">
          {copyStatus === "copied" ? copyMessage : copyLabel}
        </button>
      </div>
      <p className={copyStatus === "failed" ? styles.message : "sr-only"} role="status">{copyMessage}</p>
      <div className={styles.body} tabIndex={0} role="region" aria-label={locale === "ko" ? `${language} 코드` : `${language} code`}>
        {highlightedHtml ? (
          <div dangerouslySetInnerHTML={{__html: highlightedHtml}} />
        ) : (
          <pre><code>{code}</code></pre>
        )}
      </div>
    </div>
  );
}
