import type { Route } from "next";

/** Public Guitar URLs stay free of the internal /guitar rewrite prefix. */
export function guitarHref(pathname: "/" | "/songs" | `/songs/${string}`): Route {
  return { pathname } as unknown as Route;
}
