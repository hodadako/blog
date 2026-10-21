import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
function declarations(block: string): Record<string, string> {
  return Object.fromEntries(Array.from(block.matchAll(/(--[\w-]+):\s*([^;]+);/g), match => [match[1], match[2].trim()]));
}
const base = declarations(css.match(/:root \{([\s\S]*?)\n\}/)![1]);
const light = {...base, ...declarations(css.match(/\[data-theme="light"\] \{([\s\S]*?)\n\}/)![1])};
function resolve(tokens: Record<string, string>, name: string, visited = new Set<string>()): string {
  if (visited.has(name)) throw new Error(`Token cycle: ${name}`);
  const value = tokens[name];
  if (!value) throw new Error(`Missing token: ${name}`);
  const alias = value.match(/^var\((--[\w-]+)\)$/)?.[1];
  return alias ? resolve(tokens, alias, new Set([...visited, name])) : value;
}
function luminance(hex: string): number {
  const values = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = values.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(a: string, b: string): number {
  const [dark, bright] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (bright + 0.05) / (dark + 0.05);
}
describe("approved design implementation", () => {
  it("keeps the five user-confirmed primitive colors", () => {
    expect(["ink", "navy", "blue", "cyan", "paper"].map(name => base[`--primitive-${name}`])).toEqual(["#0a1128", "#001f54", "#034078", "#1282a2", "#fefcfb"]);
  });
  for (const [mode, tokens] of Object.entries({light, dark: base})) {
    it(`${mode}: resolves all exact aliases without cycles`, () => {
      for (const name of Object.keys(tokens)) if (/^var\(/.test(tokens[name])) expect(resolve(tokens, name)).toBeTruthy();
    });
    it(`${mode}: reading, link and action text meet AA`, () => {
      const pairs = [["--color-text", "--color-bg"], ["--color-text-muted", "--color-surface"], ["--color-accent", "--color-surface"], ["--button-text", "--button-background"], ["--button-brand-text", "--button-brand-background"], ["--button-text", "--button-neutral-hover"]];
      for (const [text, background] of pairs) expect(contrast(resolve(tokens, text), resolve(tokens, background)), `${text} on ${background}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(resolve(tokens, "--field-border"), resolve(tokens, "--color-surface"))).toBeGreaterThanOrEqual(3);
      expect(contrast(resolve(tokens, "--field-border"), resolve(tokens, "--color-bg"))).toBeGreaterThanOrEqual(3);
    });
  }
});
