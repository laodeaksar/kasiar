import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { writeThemeCookie } from "./theme-cookie";

export type ThemeChoice = "sistem" | "terang" | "gelap";
type StoredTheme = "terang" | "gelap" | null;
type ThemeToggleProps = {
  initialTheme?: StoredTheme;
  mode?: ThemeChoice;
  onModeChange?: (mode: ThemeChoice) => void;
};

const modes: readonly ThemeChoice[] = ["sistem", "terang", "gelap"];
const LABELS: Record<ThemeChoice, string> = {
  sistem: "Ikuti perangkat",
  terang: "Terang",
  gelap: "Gelap",
};
const NEXT_MODE: Record<ThemeChoice, ThemeChoice> = {
  sistem: "terang",
  terang: "gelap",
  gelap: "sistem",
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

function applyTheme(mode: ThemeChoice) {
  const theme = mode === "sistem" ? null : mode;
  writeThemeCookie(theme);
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme === "terang" ? "light" : "dark";
  else delete root.dataset.theme;
  root.style.colorScheme = theme === "terang" ? "light" : theme === "gelap" ? "dark" : "light dark";
}

function useThemeMode({ initialTheme = null, mode, onModeChange }: ThemeToggleProps) {
  const [localMode, setLocalMode] = useState<ThemeChoice>(initialTheme ?? "sistem");
  const currentMode = mode ?? localMode;

  function setMode(value: ThemeChoice) {
    setLocalMode(value);
    onModeChange?.(value);
    applyTheme(value);
  }

  return { currentMode, setMode };
}

export function ThemeToggleCompact(props: ThemeToggleProps) {
  const { currentMode, setMode } = useThemeMode(props);

  return (
    <button
      type="button"
      onClick={() => setMode(NEXT_MODE[currentMode])}
      className="btn btn-ghost btn-square"
      title={`Tema: ${LABELS[currentMode]} — klik untuk ganti`}
      aria-label={`Ganti tema. Sekarang: ${LABELS[currentMode]}`}
    >
      <ThemeIcon mode={currentMode} />
    </button>
  );
}

export function ThemeToggle(props: ThemeToggleProps) {
  const { currentMode, setMode } = useThemeMode(props);

  return (
    <div
      role="group"
      aria-label="Pilih tema tampilan"
      className="join w-full"
    >
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setMode(mode)}
          className={`join-item btn btn-sm flex-1 gap-1 ${
            currentMode === mode ? "btn-primary" : "btn-ghost border border-base-300"
          }`}
          aria-pressed={currentMode === mode}
          aria-label={LABELS[mode]}
          title={LABELS[mode]}
        >
          <ThemeIcon mode={mode} />
          <span className="hidden text-xs sm:block">{LABELS[mode]}</span>
        </button>
      ))}
    </div>
  );
}
