import { useEffect, useRef, useState } from "react";
export function TokenRows({
  names,
  kind = "color",
}: {
  names: string[];
  kind?: "color" | "spacing" | "radius";
}) {
  return (
    <div className="catalog-stack">
      {names.map((name) => (
        <TokenRow key={name} name={name} kind={kind} />
      ))}
    </div>
  );
}
function TokenRow({
  name,
  kind,
}: {
  name: string;
  kind: "color" | "spacing" | "radius";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  useEffect(() => {
    const update = () =>
      setValue(getComputedStyle(ref.current!).getPropertyValue(name).trim());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [name]);
  return (
    <div className="catalog-token" ref={ref}>
      <div>
        <code>{name}</code>
        <br />
        <small>{value}</small>
      </div>
      <div
        className="catalog-swatch"
        style={
          kind === "color"
            ? { background: `var(${name})` }
            : kind === "spacing"
              ? {
                  width: `var(${name})`,
                  background: "var(--color-accent)",
                }
              : { borderRadius: `var(${name})` }
        }
      />
    </div>
  );
}
