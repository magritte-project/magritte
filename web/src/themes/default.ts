import { getTheme } from "@/themes/apply"

/** The default theme calculated from the page's stylesheet before any changes */
export const defaultTheme = getTheme({ element: document.documentElement })
