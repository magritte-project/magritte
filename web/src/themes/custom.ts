import { ThemeSchema, type Theme } from "@/themes/base"
import { defaultTheme } from "@/themes/default"

export function retrieveCustomTheme(): Theme {
    const themeJson = localStorage.getItem("user.theme")
    if (themeJson === null) {
        return defaultTheme
    }
    try {
        return ThemeSchema.parse(JSON.parse(themeJson))
    } catch (error) {
        console.error("Discarding invalid user theme, reason:", error)
        localStorage.removeItem("user.theme")
        return defaultTheme
    }
}

export function storeCustomTheme(theme: Theme) {
    localStorage.setItem("user.theme", JSON.stringify(theme))
}
