import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
                                  children,
                                  defaultTheme = "system",
                                  storageKey = "vite-ui-theme",
                                  ...props
                              }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )

    // Функция для применения темы
    const applyTheme = (newTheme: Theme) => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (newTheme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
            root.classList.add(systemTheme)
        } else {
            root.classList.add(newTheme)
        }
    }

    useEffect(() => {
        applyTheme(theme)

        // Добавляем слушатель изменений системной темы
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            if (theme === "system") {
                const root = window.document.documentElement
                root.classList.remove("light", "dark")
                root.classList.add(e.matches ? "dark" : "light")
            }
        }

        // Современный способ добавления слушателя
        mediaQuery.addEventListener("change", handleSystemThemeChange)

        // Очистка при размонтировании
        return () => {
            mediaQuery.removeEventListener("change", handleSystemThemeChange)
        }
    }, [theme])

    const value = {
        theme,
        setTheme: (newTheme: Theme) => {
            localStorage.setItem(storageKey, newTheme)
            setTheme(newTheme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}