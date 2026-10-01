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
) as (keyof Theme["semanticColors"])[]

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
