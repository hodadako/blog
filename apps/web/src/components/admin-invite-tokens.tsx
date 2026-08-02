"use client";

import { useState } from "react";
import type { AppLocale } from "@/lib/site";
import type { InviteTokenItem } from "@/lib/types";

interface AdminInviteTokensProps {
  initialItems: InviteTokenItem[];
  locale: AppLocale;
}

export function AdminInviteTokens({ initialItems, locale }: AdminInviteTokensProps) {
  const [items, setItems] = useState(initialItems);
  const [label, setLabel] = useState("");
  const [issuedToken, setIssuedToken] = useState("");
  const [message, setMessage] = useState("");
  const ko = locale === "ko";

  async function createToken(): Promise<void> {
    setMessage("");
    const response = await fetch("/api/admin/invite-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });

    if (!response.ok) {
      setMessage(ko ? "토큰 발급에 실패했습니다." : "Failed to issue token.");
      return;
    }

    const result = await response.json() as { item: InviteTokenItem; token: string };
    setItems((current) => [result.item, ...current]);
    setIssuedToken(result.token);
    setLabel("");
    setMessage(ko ? "원문 토큰은 지금 한 번만 표시됩니다." : "The plaintext token is shown only once.");
  }

  async function revokeToken(id: string): Promise<void> {
    const response = await fetch("/api/admin/invite-tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setItems((current) => current.map((item) => item.id === id
        ? { ...item, isActive: false, revokedAt: new Date().toISOString() }
        : item));
    }
  }

  return (
    <section className="surface-card stack-md">
      <div className="stack-sm">
        <h2 className="card-title">{ko ? "초대 토큰" : "Invite tokens"}</h2>
        <p className="card-copy">{ko ? "모든 글에서 재사용할 수 있으며 언제든 폐기할 수 있습니다." : "Reusable across posts and revocable at any time."}</p>
      </div>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">{ko ? "식별 이름" : "Label"}</span>
          <input className="field__input" maxLength={80} onChange={(event) => setLabel(event.target.value)} value={label} />
        </label>
        <button className="button button--secondary" disabled={!label.trim()} onClick={() => void createToken()} type="button">
          {ko ? "토큰 발급" : "Issue token"}
        </button>
      </div>
      {issuedToken ? <code className="card-copy">{issuedToken}</code> : null}
      {message ? <p className="status-text">{message}</p> : null}
      <div className="stack-sm">
        {items.map((item) => (
          <div className="table-row" key={item.id}>
            <strong>{item.label}</strong>
            <span className="meta-row">{item.createdAt} · {item.isActive ? "active" : "revoked"}</span>
            {item.isActive ? (
              <button className="button button--secondary" onClick={() => void revokeToken(item.id)} type="button">
                {ko ? "폐기" : "Revoke"}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
