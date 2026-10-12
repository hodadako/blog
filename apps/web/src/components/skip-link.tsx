"use client";

export function SkipLink({label}: {label: string}) {
  return (
    <a
      className="skip-link"
      href="#main-content"
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const main = document.getElementById("main-content");
        if (!main) return;
        event.preventDefault();
        document.querySelector<HTMLButtonElement>('.mobile-header-shell__toggle[aria-expanded="true"]')?.click();
        // Let the existing menu finish collapsing before positioning the target.
        requestAnimationFrame(() => {
          main.focus({preventScroll: true});
          main.scrollIntoView({block: "start", behavior: "auto"});
          window.history.replaceState(window.history.state, "", "#main-content");
        });
      }}
    >
      {label}
    </a>
  );
}
