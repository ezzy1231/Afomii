'use client'

import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    const next = current === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('urbanexplore-theme', next)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex size-9 items-center justify-center rounded-xl text-app-muted transition-all hover:bg-app-elevated/70 hover:text-app-fg active:scale-95"
      aria-label="Toggle theme"
    >
      <Moon className="theme-icon-light size-4" />
      <Sun className="theme-icon-dark size-4" />
    </button>
  )
}
