import { useState } from 'react'
import { writeThemeCookie } from './theme-cookie'

type ThemeChoice = 'sistem' | 'terang' | 'gelap'
export function ThemeToggle({ initialTheme = null }: { initialTheme?: 'terang' | 'gelap' | null }) {
  const [choice, setChoice] = useState<ThemeChoice>(initialTheme ?? 'sistem')
  function changeTheme(value: ThemeChoice) {
    setChoice(value)
    const theme = value === 'sistem' ? null : value
    writeThemeCookie(theme)
    const root = document.documentElement
    if (theme) root.dataset.theme = theme === 'terang' ? 'light' : 'dark'
    else delete root.dataset.theme
    root.style.colorScheme =
      theme === 'terang' ? 'light' : theme === 'gelap' ? 'dark' : 'light dark'
  }
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <span>Tema</span>
      <select
        className="select select-bordered select-sm min-h-11"
        aria-label="Pilih tema tampilan"
        value={choice}
        onChange={(event) => changeTheme(event.target.value as ThemeChoice)}
      >
        <option value="sistem">Ikuti perangkat</option>
        <option value="terang">Terang</option>
        <option value="gelap">Gelap</option>
      </select>
    </label>
  )
}
