import {createElement, createRef} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it} from "vitest";
import {ActionButton, Button, EmptyState, Input, Select, Tag, Textarea, TextLink, buttonClassName} from "./ui";

describe("shared native components", () => {
  it("keeps the ActionButton alias and defaults actions to type=button", () => {
    expect(ActionButton).toBe(Button);
    expect(renderToStaticMarkup(createElement(Button, null, "Save"))).toContain('type="button"');
    expect(renderToStaticMarkup(createElement(Button, {type: "submit", name: "decision", value: "published"}, "Save"))).toContain('type="submit"');
    expect(buttonClassName({variant: "secondary", size: "compact", className: "rail"})).toBe("button button--secondary button--compact rail");
  });

  it("preserves native disabled, pressed, form and accessible attributes", () => {
    const html = renderToStaticMarkup(createElement(Button, {disabled: true, "aria-pressed": true, "aria-label": "Pause", form: "settings", variant: "quiet"}, "Pause"));
    for (const attribute of ['disabled=""', 'aria-pressed="true"', 'aria-label="Pause"', 'form="settings"', 'button--quiet']) expect(html).toContain(attribute);
    expect(html).not.toContain('variant=');
  });

  it("forwards React 19 refs and handlers without wrapping behavior", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = () => undefined;
    const button = Button({ref, onClick, children: "Save"});
    expect(button.props.ref).toBe(ref);
    expect(button.props.onClick).toBe(onClick);
    const inputRef = createRef<HTMLInputElement>();
    expect(Input({ref: inputRef}).props.ref).toBe(inputRef);
  });

  it("keeps field semantics, names, constraints and density", () => {
    const input = renderToStaticMarkup(createElement(Input, {name: "password", required: true, type: "password", appearance: "outline", density: "compact", maxLength: 80}));
    for (const fragment of ['field__input field--outline field--compact', 'name="password"', 'required=""', 'type="password"', 'maxLength="80"']) expect(input).toContain(fragment);
    expect(input).not.toContain('appearance=');
    expect(renderToStaticMarkup(createElement(Textarea, {defaultValue: "draft", name: "content", rows: 4}))).toContain('name="content" rows="4"');
    const select = renderToStaticMarkup(createElement(Select, {defaultValue: "2", disabled: true}, createElement("option", {value: "2"}, "2프렛")));
    expect(select).toContain('selected=""');
    expect(select).toContain('<select disabled="" class="field__select">');
  });

  it("keeps links as anchors and tags as noninteractive text", () => {
    expect(renderToStaticMarkup(createElement(TextLink, {href: "https://example.com", target: "_blank", rel: "noopener", className: "author"}, "Author"))).toContain('class="text-link author"');
    expect(renderToStaticMarkup(createElement(Tag, {"aria-label": "Category"}, "Spring"))).toBe('<span aria-label="Category" class="pill">Spring</span>');
    expect(renderToStaticMarkup(createElement(EmptyState, {role: "status"}, "No results"))).toBe('<p role="status" class="empty-message">No results</p>');
  });
});
