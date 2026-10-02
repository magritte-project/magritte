import { type Theme, ThemeSchema, type ThemeSection, type ThemeSectionKey } from "@/themes/base"
import { getPropertyName } from "@/utilities/css"

export interface ReadThemeOptions {
    readonly element: HTMLElement
}

/**
 * Read a theme from the theme variables of a given element's styles.
 *
 * @param element The element to read theme variables from.
 * @returns A theme.
 */
export function readTheme({ element }: ReadThemeOptions): Theme {
    const computedStyle = getComputedStyle(element)
    return ThemeSchema.parse({
        semanticColors: readThemeSectionValues({
            style: computedStyle,
            varPrefix: "color",
            section: "semanticColors",
        }),
        semanticOpacities: readThemeSectionValues({
            style: computedStyle,
            varPrefix: "opacity",
            section: "semanticOpacities",
        }),
        semanticSpacings: readThemeSectionValues({
            style: computedStyle,
            varPrefix: "spacing",
            section: "semanticSpacings",
        }),
        semanticRadii: readThemeSectionValues({
            style: computedStyle,
            varPrefix: "radius",
            section: "semanticRadii",
        }),
        defaults: readThemeSectionValues({
            style: computedStyle,
            varPrefix: "default",
            section: "defaults",
        }),
    } satisfies Theme)
}

interface readThemeSectionValuesOptions<SectionKey extends ThemeSectionKey> {
    readonly style: CSSStyleDeclaration
    readonly varPrefix: string
    readonly section: SectionKey
}

function readThemeSectionValues<const SectionKey extends ThemeSectionKey>({
    style,
    varPrefix,
    section,
}: readThemeSectionValuesOptions<SectionKey>) {
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
