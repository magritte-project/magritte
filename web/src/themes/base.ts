import z from "zod"

export const ThemeSchema = z.object({
    defaults: z.object({
        fontFamily: z.string().optional(),
        monoFontFamily: z.string().optional(),
        colorScheme: z.string().optional(),
    }),

    semanticColors: z.object({
        primary: z.string().optional(),
        primaryActive: z.string().optional(),
        onPrimary: z.string().optional(),

        secondary: z.string().optional(),
        secondaryActive: z.string().optional(),
        onSecondary: z.string().optional(),

        tertiary: z.string().optional(),
        tertiaryActive: z.string().optional(),
        onTertiary: z.string().optional(),

        quaternary: z.string().optional(),
        quaternaryActive: z.string().optional(),
        onQuaternary: z.string().optional(),

        placeholder: z.string().optional(),
        outline: z.string().optional(),
        outlineFocus: z.string().optional(),
        separator: z.string().optional(),

        key: z.string().optional(),
        onKey: z.string().optional(),
        keyActive: z.string().optional(),
        onKeyActive: z.string().optional(),
        keySubtle: z.string().optional(),

        destructive: z.string().optional(),
        onDestructive: z.string().optional(),
        destructiveActive: z.string().optional(),
        onDestructiveActive: z.string().optional(),
        destructiveSubtle: z.string().optional(),

        highContrast: z.string().optional(),
    }),

    semanticOpacities: z.object({
        disabled: z.string().optional(),
    }),

    semanticSpacings: z.object({
        xs: z.string().optional(),
        sm: z.string().optional(),
        md: z.string().optional(),
        lg: z.string().optional(),
        xl: z.string().optional(),
        header: z.string().optional(),
        footer: z.string().optional(),
    }),

    semanticRadii: z.object({
        panel: z.string().optional(),
        artwork: z.string().optional(),
        li: z.string().optional(),
        input: z.string().optional(),
        button: z.string().optional(),
    }),
})

export type Theme = z.infer<typeof ThemeSchema>

export type ThemeSectionKey = keyof Theme

export type ThemeSection<Key extends ThemeSectionKey> = Theme[Key]

export function getThemeSectionKeys<Key extends ThemeSectionKey>(
    key: Key,
): readonly (keyof Theme[Key])[] {
    return Object.keys(ThemeSchema.shape[key].shape) as (keyof Theme[Key])[]
}
