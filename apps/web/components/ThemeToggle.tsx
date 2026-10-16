'use client'

import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    const next = current === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try { window.localStorage.setItem('urbanexplore-theme', next) } catch { /* storage unavailable */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#060F1D' : '#FBF5F0')
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex size-11 items-center justify-center rounded-xl text-app-muted transition-colors hover:bg-app-alt hover:text-app-fg active:scale-95"
      aria-label="Toggle theme"
    >
      <Moon className="theme-icon-light size-[18px]" aria-hidden />
      <Sun className="theme-icon-dark size-[18px]" aria-hidden />
    </button>
  )
}
