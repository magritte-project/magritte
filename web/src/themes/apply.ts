import { ThemeSchema, type Theme, type ThemeSection, type ThemeSectionKey } from "@/themes/base"
import { getPropertyName } from "@/utilities/css"

export interface ApplyThemeOptions {
    readonly element: HTMLElement
    readonly theme: Theme
    readonly fallback: Theme
}

export function applyTheme({ element, theme, fallback }: ApplyThemeOptions) {
    applyThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "color",
        section: "semanticColors",
    })
    applyThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "opacity",
        section: "semanticOpacities",
    })
    applyThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "spacing",
        section: "semanticSpacings",
    })
    applyThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "radius",
        section: "semanticRadii",
    })
    applyThemeSectionValues({
        style: element.style,
        theme,
        fallback,
        varPrefix: "default",
        section: "defaults",
    })
}

interface ApplyThemeSectionValuesOptions<SectionKey extends ThemeSectionKey> {
    readonly style: CSSStyleDeclaration
    readonly theme: Theme
    readonly fallback: Theme
    readonly varPrefix: string
    readonly section: SectionKey
}

function applyThemeSectionValues<const SectionKey extends ThemeSectionKey>({
    style,
    theme,
    fallback,
    varPrefix,
    section,
}: ApplyThemeSectionValuesOptions<SectionKey>) {
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
