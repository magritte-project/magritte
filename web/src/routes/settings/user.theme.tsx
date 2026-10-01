import { createFileRoute } from "@tanstack/react-router"

import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { useAppForm } from "@/hooks/formHook"
import { setTheme } from "@/themes/apply"
import { ThemeSchema, type Theme } from "@/themes/base"
import { defaultTheme } from "@/themes/default"
import { DISPLAY, MONOSPACE } from "@/themes/typefaces"
import { camelCaseToTitleCase } from "@/utilities/strings"

const SEMANTIC_COLOR_KEYS = Object.keys(
    ThemeSchema.shape.semanticColors.shape,
) as readonly (keyof Theme["semanticColors"])[]
const SEMANTIC_OPACITIES_KEYS = Object.keys(
    ThemeSchema.shape.semanticOpacities.shape,
) as readonly (keyof Theme["semanticOpacities"])[]
const SEMANTIC_SPACINGS_KEYS = Object.keys(
    ThemeSchema.shape.semanticSpacings.shape,
) as readonly (keyof Theme["semanticSpacings"])[]
const SEMANTIC_RADII_KEYS = Object.keys(
    ThemeSchema.shape.semanticRadii.shape,
) as readonly (keyof Theme["semanticRadii"])[]

export const Route = createFileRoute("/settings/user/theme")({
    component: function UserTheme() {
        const form = useAppForm({
            defaultValues: defaultTheme,
            onSubmit: ({ value }) => {
                setTheme({
                    element: document.documentElement,
                    theme: value,
                    fallback: defaultTheme,
                })
            },
        })

        return (
            <AppForm form={form} className="flex flex-col gap-lg">
                <h1 className="flex items-center gap-lg sticky top-header bg-primary z-50">
                    <div className="flex-1 text-xl font-bold">Theme</div>
                    <ThemedSubtleButton type="button" onClick={() => form.reset()}>
                        Reset
                    </ThemedSubtleButton>
                    <form.SubmitButton>Apply</form.SubmitButton>
                </h1>

                <h2 className="flex-1 mt-xl text-lg font-bold">Semantic Colors</h2>
                <ol className="flex flex-col gap-lg">
                    {SEMANTIC_COLOR_KEYS.map((key, index) => (
                        <li key={`semanticColors[${key}@${index}]`}>
                            <form.AppField name={`semanticColors.${key}`}>
                                {(field) => <field.ColorField label={camelCaseToTitleCase(key)} />}
                            </form.AppField>
                        </li>
                    ))}
                </ol>

                <h2 className="flex-1 mt-xl text-lg font-bold">Semantic Opacities</h2>
                <ol className="flex flex-col gap-lg">
                    {SEMANTIC_OPACITIES_KEYS.map((key, index) => (
                        <li key={`semanticOpacities[${key}@${index}]`}>
                            <form.AppField name={`semanticOpacities.${key}`}>
                                {(field) => (
                                    <FieldDecoration
                                        field={field}
                                        label={camelCaseToTitleCase(key)}
                                    >
                                        <field.InputField />
                                    </FieldDecoration>
                                )}
                            </form.AppField>
                        </li>
                    ))}
                </ol>

                <h2 className="flex-1 mt-xl text-lg font-bold">Semantic Spacings</h2>
                <ol className="flex flex-col gap-lg">
                    {SEMANTIC_SPACINGS_KEYS.map((key, index) => (
                        <li key={`semanticSpacings[${key}@${index}]`}>
                            <form.AppField name={`semanticSpacings.${key}`}>
                                {(field) => (
                                    <FieldDecoration
                                        field={field}
                                        label={camelCaseToTitleCase(key)}
                                    >
                                        <field.InputField />
                                    </FieldDecoration>
                                )}
                            </form.AppField>
                        </li>
                    ))}
                </ol>

                <h2 className="flex-1 mt-xl text-lg font-bold">Semantic Radii</h2>
                <ol className="flex flex-col gap-lg">
                    {SEMANTIC_RADII_KEYS.map((key, index) => (
                        <li key={`semanticRadii[${key}@${index}]`}>
                            <form.AppField name={`semanticRadii.${key}`}>
                                {(field) => (
                                    <FieldDecoration
                                        field={field}
                                        label={camelCaseToTitleCase(key)}
                                    >
                                        <field.InputField />
                                    </FieldDecoration>
                                )}
                            </form.AppField>
                        </li>
                    ))}
                </ol>

                <h2 className="flex-1 mt-xl text-lg font-bold">Defaults</h2>
                <form.AppField name="defaults.fontFamily">
                    {(field) => (
                        <FieldDecoration field={field} label="Display Font">
                            <field.SelectField options={DISPLAY} />
                        </FieldDecoration>
                    )}
                </form.AppField>
                <form.AppField name="defaults.monoFontFamily">
                    {(field) => (
                        <FieldDecoration field={field} label="Monospace Font">
                            <field.SelectField options={MONOSPACE} />
                        </FieldDecoration>
                    )}
                </form.AppField>
            </AppForm>
        )
    },
})
