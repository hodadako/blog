"use client";

import { useTheme, type ThemePreference } from "@/components/theme-context";
import styles from "@/app/guitar/guitar.module.css";

export function ThemePreferenceSelect() {
  const { preference, setPreference } = useTheme();
  return (
    <label className={styles.themeControl}>
      <span>테마</span>
      <select aria-label="테마" className="theme-toggle__trigger theme-toggle__trigger--current" onChange={(event) => setPreference(event.currentTarget.value as ThemePreference)} value={preference}>
        <option value="system">시스템 설정</option>
        <option value="light">밝게</option>
        <option value="dark">어둡게</option>
      </select>
    </label>
  );
}
