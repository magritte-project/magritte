import { createFileRoute } from "@tanstack/react-router"

import AppForm from "@/components/reusable/AppForm"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { useAppForm } from "@/hooks/formHook"
import { setTheme } from "@/themes/apply"
import { ThemeSchema, type Theme } from "@/themes/base"
import { defaultTheme } from "@/themes/default"
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
            <AppForm form={form} className="flex flex-col gap-between">
                <h2 className="flex items-center gap-between">
                    <div className="flex-1 text-lg font-bold">Semantic Colors</div>
                    <ThemedSubtleButton type="button" onClick={() => form.reset()}>
                        Reset
                    </ThemedSubtleButton>
                    <form.SubmitButton>Apply</form.SubmitButton>
                </h2>
                <ol className="flex flex-col gap-between">
                    {SEMANTIC_COLOR_KEYS.map((key, index) => (
                        <li key={`semanticColors[${key}@${index}]`}>
                            <form.AppField name={`semanticColors.${key}`}>
                                {(field) => <field.ColorField label={camelCaseToTitleCase(key)} />}
                            </form.AppField>
                        </li>
                    ))}
                </ol>
            </AppForm>
        )
    },
})
