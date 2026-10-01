import { ThemeSchema, type Theme, type ThemeSection, type ThemeSectionKey } from "@/themes/base"
import { getPropertyName } from "@/utilities/css"

export interface GetThemeOptions {
    readonly element: HTMLElement
}

/**
 * Creates a theme from the theme variables of a given element's styles.
 *
 * @param element The element to read theme variables from.
 * @returns A theme.
 */
export function getTheme({ element }: GetThemeOptions): Theme {
    const computedStyle = getComputedStyle(element)
    return ThemeSchema.parse({
        semanticColors: getThemeSectionValues({
            style: computedStyle,
            varPrefix: "color",
            section: "semanticColors",
        }),
        semanticOpacities: getThemeSectionValues({
            style: computedStyle,
            varPrefix: "opacity",
            section: "semanticOpacities",
        }),
        semanticSpacings: getThemeSectionValues({
            style: computedStyle,
            varPrefix: "spacing",
            section: "semanticSpacings",
        }),
        semanticRadii: getThemeSectionValues({
            style: computedStyle,
            varPrefix: "radius",
            section: "semanticRadii",
        }),
        defaults: getThemeSectionValues({
            style: computedStyle,
            varPrefix: "default",
            section: "defaults",
        }),
    } satisfies Theme)
}

interface GetThemeSectionValuesOptions<SectionKey extends ThemeSectionKey> {
    readonly style: CSSStyleDeclaration
    readonly varPrefix: string
    readonly section: SectionKey
}

function getThemeSectionValues<const SectionKey extends ThemeSectionKey>({
    style,
    varPrefix,
    section,
}: GetThemeSectionValuesOptions<SectionKey>) {
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

export interface SetThemeOptions {
    readonly element: HTMLElement
    readonly theme: Theme
    readonly fallback: Theme
}

export function setTheme({ element, theme, fallback }: SetThemeOptions) {
    setThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "color",
        section: "semanticColors",
    })
    setThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "opacity",
        section: "semanticOpacities",
    })
    setThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "spacing",
        section: "semanticSpacings",
    })
    setThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "radius",
        section: "semanticRadii",
    })
    setThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "default",
        section: "defaults",
    })
}

interface SetThemeSectionValuesOptions<SectionKey extends ThemeSectionKey> {
    readonly style: CSSStyleDeclaration
    readonly theme: Theme
    readonly fallback: Theme
    readonly varPrefix: string
    readonly section: SectionKey
}

function setThemeSectionValues<const SectionKey extends ThemeSectionKey>({
    style,
    theme,
    fallback,
    varPrefix,
    section,
}: SetThemeSectionValuesOptions<SectionKey>) {
    const sectionObject = theme[section]
    const fallbackSectionObject = fallback[section]
    const keys = Object.keys(ThemeSchema.shape[section].shape) as (keyof ThemeSection<SectionKey>)[]
    for (const key of keys) {
        const value = sectionObject[key] ?? fallbackSectionObject[key]
        if (value === undefined) {
            throw new Error(`No value found for theme.${section}.${String(key)}`)
        }
        const property = getPropertyName(String(key), varPrefix)
        style.setProperty(property, String(value))
    }
}
