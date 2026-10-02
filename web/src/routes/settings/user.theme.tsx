import { createFileRoute } from "@tanstack/react-router"

import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedSection from "@/components/theme/ThemedSection"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { useAppForm } from "@/hooks/formHook"
import { applyTheme } from "@/themes/apply"
import { getThemeSectionKeys } from "@/themes/base"
import { defaultTheme } from "@/themes/default"
import { DISPLAY_FONTS, MONOSPACE_FONTS } from "@/themes/fonts"
import { camelCaseToTitleCase } from "@/utilities/strings"

export const Route = createFileRoute("/settings/user/theme")({
    component: function UserTheme() {
        const form = useAppForm({
            defaultValues: defaultTheme,
            onSubmit: ({ value }) => {
                applyTheme({
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

                <ThemedSection containerClassName="w-full" header="Defaults">
                    <form.AppField name="defaults.fontFamily">
                        {(field) => (
                            <FieldDecoration field={field} label="Display Font">
                                <field.SelectField options={DISPLAY_FONTS} />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                    <form.AppField name="defaults.monoFontFamily">
                        {(field) => (
                            <FieldDecoration field={field} label="Monospace Font">
                                <field.SelectField options={MONOSPACE_FONTS} />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                    <form.AppField name="defaults.colorScheme">
                        {(field) => (
                            <FieldDecoration field={field} label="Color Scheme">
                                <field.SelectField
                                    options={[
                                        { label: "Dark", value: "dark" },
                                        { label: "Light", value: "light" },
                                    ]}
                                />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                </ThemedSection>

                <ThemedSection header="Semantic Colors">
                    <ol className="flex flex-col gap-lg">
                        {getThemeSectionKeys("semanticColors").map((key, index) => (
                            <li key={`semanticColors[${key}@${index}]`}>
                                <form.AppField name={`semanticColors.${key}`}>
                                    {(field) => (
                                        <field.ColorField label={camelCaseToTitleCase(key)} />
                                    )}
                                </form.AppField>
                            </li>
                        ))}
                    </ol>
                </ThemedSection>

                <ThemedSection header="Semantic Opacities">
                    <ol className="flex flex-col gap-lg">
                        {getThemeSectionKeys("semanticOpacities").map((key, index) => (
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
                </ThemedSection>

                <ThemedSection header="Semantic Spacings">
                    <ol className="flex flex-col gap-lg">
                        {getThemeSectionKeys("semanticSpacings").map((key, index) => (
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
                </ThemedSection>

                <ThemedSection header="Semantic Radii">
                    <ol className="flex flex-col gap-lg">
                        {getThemeSectionKeys("semanticRadii").map((key, index) => (
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
                </ThemedSection>
            </AppForm>
        )
    },
})
