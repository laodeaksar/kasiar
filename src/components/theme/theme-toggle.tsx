import type { LucideIcon } from "lucide-react";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { writeThemeCookie } from "./theme-cookie";

type ThemeChoice = "sistem" | "terang" | "gelap";

const modes: readonly ThemeChoice[] = ["sistem", "terang", "gelap"];
const LABELS: Record<ThemeChoice, string> = {
  sistem: "Ikuti perangkat",
  terang: "Terang",
  gelap: "Gelap",
};
const ICONS: Record<ThemeChoice, LucideIcon> = {
  sistem: Monitor,
  terang: Sun,
  gelap: Moon,
};

function ThemeIcon({ mode }: { mode: ThemeChoice }) {
  const Icon = ICONS[mode];
  return (
    <Icon
      className="size-4"
      aria-hidden="true"
    />
  );
}

export function ThemeToggle({ initialTheme = null }: { initialTheme?: "terang" | "gelap" | null }) {
  const [mode, setModeState] = useState<ThemeChoice>(initialTheme ?? "sistem");

  function setMode(value: ThemeChoice) {
    setModeState(value);
    const theme = value === "sistem" ? null : value;
    writeThemeCookie(theme);
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme === "terang" ? "light" : "dark";
    else delete root.dataset.theme;
    root.style.colorScheme =
      theme === "terang" ? "light" : theme === "gelap" ? "dark" : "light dark";
  }

  return (
    <div
      role="group"
      aria-label="Pilih tema tampilan"
      className="join w-full"
    >
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`join-item btn btn-sm flex-1 gap-1 ${
            mode === m ? "btn-primary" : "btn-ghost border border-base-300"
          }`}
          aria-pressed={mode === m}
          aria-label={LABELS[m]}
          title={LABELS[m]}
        >
          <ThemeIcon mode={m} />
          <span className="hidden text-xs sm:block">{LABELS[m]}</span>
        </button>
      ))}
    </div>
  );
}
