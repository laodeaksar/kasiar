export type StoredTheme = 'terang' | 'gelap'
export function readThemeCookie(cookie: string): StoredTheme | null {
  const value = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('tema='))?.slice(5)
  return value === 'terang' || value === 'gelap' ? value : null
}
export function writeThemeCookie(theme: StoredTheme | null): void {
  if (typeof document === 'undefined') return
  document.cookie = theme ? `tema=${theme}; Path=/; Max-Age=31536000; SameSite=Lax` : 'tema=; Path=/; Max-Age=0; SameSite=Lax'
}
