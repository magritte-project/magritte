import { ThemeSchema, type Theme } from "@/themes/base"

/** The default theme calculated from the page's stylesheet before any changes */
export const defaultTheme = buildThemeFromStyle(document.documentElement)

/**
 * Creates a theme from the theme variables of a given element's styles.
 *
 * @param element The element to read theme variables from.
 * @returns A theme.
 */
function buildThemeFromStyle(element: HTMLElement): Theme {
    const computedStyle = getComputedStyle(element)
    return ThemeSchema.parse({
        semanticColors: getThemeSection({
            style: computedStyle,
            varPrefix: "color",
            themeSection: "semanticColors",
        }),
        semanticOpacities: getThemeSection({
            style: computedStyle,
            varPrefix: "opacity",
            themeSection: "semanticOpacities",
        }),
        semanticSpacings: getThemeSection({
            style: computedStyle,
            varPrefix: "spacing",
            themeSection: "semanticSpacings",
        }),
        defaults: getThemeSection({
            style: computedStyle,
            varPrefix: "default",
            themeSection: "defaults",
        }),
    } satisfies Theme)
}

interface GetThemeSectionOptions {
    readonly style: CSSStyleDeclaration
    readonly varPrefix: string
    readonly themeSection: keyof typeof ThemeSchema.shape
}

function getThemeSection({
    style,
    varPrefix: prefix,
    themeSection,
}: GetThemeSectionOptions): Record<string, string> {
    const section: Record<string, string> = {}
    const keys = Object.keys(ThemeSchema.shape[themeSection].shape)
    for (const key of keys) {
        const property = `--${prefix}-${camelToKebab(key)}`
        const value = style.getPropertyValue(property)
        if (value) {
            section[key] = value
        }
    }
    return section
}

function camelToKebab(value: string): string {
    return value
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .toLowerCase()
}
