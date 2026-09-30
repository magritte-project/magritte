import { ThemeSchema, type Theme, type ThemeSection, type ThemeSectionKey } from "@/themes/base"
import { getPropertyName } from "@/utilities/strings"

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
        semanticColors: getThemeSectionObject({
            style: computedStyle,
            varPrefix: "color",
            section: "semanticColors",
        }),
        semanticOpacities: getThemeSectionObject({
            style: computedStyle,
            varPrefix: "opacity",
            section: "semanticOpacities",
        }),
        semanticSpacings: getThemeSectionObject({
            style: computedStyle,
            varPrefix: "spacing",
            section: "semanticSpacings",
        }),
        defaults: getThemeSectionObject({
            style: computedStyle,
            varPrefix: "default",
            section: "defaults",
        }),
    } satisfies Theme)
}

interface GetThemeSectionOptions<SectionKey extends ThemeSectionKey> {
    readonly style: CSSStyleDeclaration
    readonly varPrefix: string
    readonly section: SectionKey
}

function getThemeSectionObject<const SectionKey extends ThemeSectionKey>({
    style,
    varPrefix,
    section,
}: GetThemeSectionOptions<SectionKey>) {
    const sectionObject: Partial<Record<SectionKey, string>> = {}
    const keys = Object.keys(ThemeSchema.shape[section].shape) as SectionKey[]
    for (const key of keys) {
        const property = getPropertyName(key, varPrefix)
        const value = style.getPropertyValue(property)
        if (value) {
            sectionObject[key] = value
        }
    }
    return sectionObject as ThemeSection<SectionKey>
}
