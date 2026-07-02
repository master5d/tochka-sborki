"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "./button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-2">
      <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme("light")}>
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
        <span className="sr-only">Light mode</span>
      </Button>
      <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme("dark")}>
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
        <span className="sr-only">Dark mode</span>
      </Button>
      <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme("system")}>
        <span className="text-sm font-medium">System</span>
        <span className="sr-only">System mode</span>
      </Button>
    </div>
  )
}
