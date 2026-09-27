"use client";

import type {Route} from "next";
import Link from "next/link";
import {usePathname} from "next/navigation";
import type {AppLocale} from "@/lib/site";

interface SiteNavLinksProps {
  locale: AppLocale;
  label: string;
  blogLabel: string;
  recordsLabel: string;
  projectsLabel: string;
  showProjects: boolean;
}

export function SiteNavLinks({locale, label, blogLabel, recordsLabel, projectsLabel, showProjects}: SiteNavLinksProps) {
  const pathname = usePathname();

  function navLink(path: "projects" | "blog" | "records", text: string) {
    const href = `/${locale}/${path}` as Route;
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link aria-current={active ? "page" : undefined} className="site-nav__link" href={href}>
        {text}
      </Link>
    );
  }

  return (
    <nav className="site-nav__links" aria-label={label}>
      {showProjects ? navLink("projects", projectsLabel) : null}
      {navLink("blog", blogLabel)}
      {navLink("records", recordsLabel)}
    </nav>
  );
}
