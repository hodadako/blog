"use client";

import {useEffect, useState} from "react";
import {codeToHtml} from "shiki";
import styles from "./code-block.module.css";

interface CodeBlockProps {
  code: string;
  language: string;
}

const SHIKI_THEME = "github-dark";

export function CodeBlock({code, language}: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void codeToHtml(code, {
      lang: language,
      theme: SHIKI_THEME,
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
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    window.setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.language}>{language}</span>
        <button className={styles.copyButton} onClick={() => { void handleCopy(); }} type="button">
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      {highlightedHtml ? (
        <div className={styles.body} dangerouslySetInnerHTML={{__html: highlightedHtml}} />
      ) : (
        <div className={styles.body}>
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
