import { readTheme } from "@/themes/read"
import { poll } from "@/utilities/promises"

import "@magritte/fonts"

import "@/styles.css"

/** The default theme calculated from the page's stylesheet before any changes */
export const defaultTheme = readTheme({
    element: await poll(() => document.documentElement, {
        test: (next) => !!getComputedStyle(next).getPropertyValue("--color-primary"),
        waitTime: 100,
        attempts: 10,
    }),
})
