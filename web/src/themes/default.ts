import { readTheme } from "@/themes/read"

/** The default theme calculated from the page's stylesheet before any changes */
export const defaultTheme = readTheme({ element: document.documentElement })
