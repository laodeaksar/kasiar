export type PasswordStrength = 'Lemah' | 'Sedang' | 'Kuat'

export function getPasswordStrength(password: string, username = ''): PasswordStrength {
  if (password.length < 8 || (username !== '' && password.toLocaleLowerCase() === username.toLocaleLowerCase())) return 'Lemah'
  const kinds = [/[a-z]/.test(password), /[A-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length
  if (kinds < 2) return 'Lemah'
  return password.length >= 12 && kinds >= 3 ? 'Kuat' : 'Sedang'
}

export function getPasswordSuggestion(strength: PasswordStrength): string {
  if (strength === 'Lemah') return 'Tambahkan huruf besar, angka, atau simbol.'
  if (strength === 'Sedang') return 'Untuk lebih kuat, gunakan minimal 12 karakter dan 3 jenis karakter.'
  return 'Password sudah kuat.'
}
