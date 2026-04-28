"use client";

import Snowfall from "react-snowfall";
import {useTheme} from "@/components/theme-context";

export function ThemeBackground() {
  const {theme} = useTheme();

  if (theme !== "light") {
    return null;
  }

  return (
    <div aria-hidden="true" className="site-shell__snowfall">
      <Snowfall color="rgba(162, 177, 193, 0.95)" snowflakeCount={150} />
    </div>
  );
}
