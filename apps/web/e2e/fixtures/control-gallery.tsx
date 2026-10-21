"use client";

import {useState} from "react";
import {Button, IconButton, ToggleButton, type ButtonVariant} from "@/components/ui";
import {SegmentedControl} from "@/components/segmented-control";

/** Mounted only in the isolated verification build, never in the product router. */
export function ControlGallery() {
  const [pressed, setPressed] = useState(false);
  const [selection, setSelection] = useState("first");
  return (
    <div style={{maxWidth: "var(--measure-width)", padding: "var(--space-5)", margin: "auto", display: "grid", gap: "var(--space-5)"}}>
      <h1>공통 UI 확인</h1>
      {(["primary", "secondary", "outline", "ghost", "destructive"] as ButtonVariant[]).map(variant => (
        <section aria-label={variant} key={variant}>
          <h2>{variant}</h2>
          <div style={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-2)"}}>
            <Button variant={variant} size="sm">작게</Button>
            <Button variant={variant}>기본</Button>
            <Button variant={variant} size="lg">크게</Button>
            <IconButton variant={variant} aria-label={`${variant} 추가`}>＋</IconButton>
            <Button variant={variant} disabled>사용 불가</Button>
          </div>
        </section>
      ))}
      <ToggleButton pressed={pressed} onClick={() => setPressed(!pressed)}>상태 전환</ToggleButton>
      <SegmentedControl aria-label="선택 검증" options={[{value: "first", label: "첫 번째"}, {value: "disabled", label: "사용 불가", disabled: true}, {value: "last", label: "마지막"}]} value={selection} onValueChange={setSelection} />
    </div>
  );
}
