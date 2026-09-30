import { ThemeSchema, type Theme, type ThemeSection, type ThemeSectionKey } from "@/themes/base"
import { getPropertyName } from "@/utilities/strings"

export interface ApplyThemeOptions {
    readonly element: HTMLElement
    readonly theme: Theme
    readonly fallback: Theme
}

export function applyTheme({ element, theme, fallback }: ApplyThemeOptions) {
    applyThemeSection({
        style: element.style,
        theme,
        fallback,
        varPrefix: "color",
        section: "semanticColors",
    })
    applyThemeSection({
        style: element.style,
        theme,
        fallback,
        varPrefix: "opacity",
        section: "semanticOpacities",
    })
    applyThemeSection({
        style: element.style,
        theme,
        fallback,
        varPrefix: "spacing",
        section: "semanticSpacings",
    })
    applyThemeSection({
        style: element.style,
        theme,
        fallback,
        varPrefix: "default",
        section: "defaults",
    })
}

interface ApplyThemeSectionOptions<SectionKey extends ThemeSectionKey> {
    readonly style: CSSStyleDeclaration
    readonly theme: Theme
    readonly fallback: Theme
    readonly varPrefix: string
    readonly section: SectionKey
}

function applyThemeSection<const SectionKey extends ThemeSectionKey>({
    style,
    theme,
    fallback,
    varPrefix,
    section,
}: ApplyThemeSectionOptions<SectionKey>) {
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
