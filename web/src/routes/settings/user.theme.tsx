import { Field, Label } from "@headlessui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"

import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import ThemedSection from "@/components/theme/ThemedSection"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { useAppForm } from "@/hooks/formHook"
import { applyTheme } from "@/themes/apply"
import { getThemeSectionKeys, type ThemeSection } from "@/themes/base"
import { nextColors } from "@/themes/calculations"
import { defaultTheme } from "@/themes/default"
import { DISPLAY_FONTS, MONOSPACE_FONTS } from "@/themes/fonts"
import { camelCaseToTitleCase } from "@/utilities/strings"

const MAGIC_SEMANTIC_COLORS: ReadonlySet<keyof ThemeSection<"semanticColors">> = new Set([
    "primary",
    "primaryActive",
    "onPrimary",
    "secondary",
    "secondaryActive",
    "onSecondary",
    "tertiary",
    "tertiaryActive",
    "onTertiary",
    "quaternary",
    "quaternaryActive",
    "onQuaternary",
])

export const Route = createFileRoute("/settings/user/theme")({
    component: function UserTheme() {
        const [showAllColors, setShowAllColors] = useState(false)
        const semanticColorsKeys = useMemo(
            () =>
                showAllColors
                    ? getThemeSectionKeys("semanticColors")
                    : getThemeSectionKeys("semanticColors").filter(
                          (key) => !MAGIC_SEMANTIC_COLORS.has(key),
                      ),
            [showAllColors],
        )

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
                    <Field className="flex items-center gap-md mb-lg">
                        <ThemedCheckbox
                            className="peer"
                            id="showAllColors"
                            checked={showAllColors}
                            onChange={setShowAllColors}
                        />
                        <Label
                            htmlFor="showAllColors"
                            className="text-sm font-semibold peer-aria-disabled:opacity-disabled"
                        >
                            Show All Colors
                        </Label>
                    </Field>
                    <ol className="flex flex-col gap-lg">
                        {!showAllColors && (
                            <>
                                <li>
                                    <form.AppField
                                        name="semanticColors.primary"
                                        listeners={{
                                            onChange: ({ value: primary }) => {
                                                const { secondary, tertiary, quaternary } =
                                                    nextColors(primary ?? "")
                                                form.setFieldValue(
                                                    "semanticColors.secondary",
                                                    secondary,
                                                )
                                                form.setFieldValue(
                                                    "semanticColors.tertiary",
                                                    tertiary,
                                                )
                                                form.setFieldValue(
                                                    "semanticColors.quaternary",
                                                    quaternary,
                                                )
                                            },
                                        }}
                                    >
                                        {(field) => (
                                            <FieldDecoration field={field} label="Background">
                                                <field.ColorField />
                                            </FieldDecoration>
                                        )}
                                    </form.AppField>
                                </li>
                                <li>
                                    <form.AppField
                                        name="semanticColors.primaryActive"
                                        listeners={{
                                            onChange: ({ value: primary }) => {
                                                const { secondary, tertiary, quaternary } =
                                                    nextColors(primary ?? "")
                                                form.setFieldValue(
                                                    "semanticColors.secondaryActive",
                                                    secondary,
                                                )
                                                form.setFieldValue(
                                                    "semanticColors.tertiaryActive",
                                                    tertiary,
                                                )
                                                form.setFieldValue(
                                                    "semanticColors.quaternaryActive",
                                                    quaternary,
                                                )
                                            },
                                        }}
                                    >
                                        {(field) => (
                                            <FieldDecoration
                                                field={field}
                                                label="Background Active"
                                            >
                                                <field.ColorField />
                                            </FieldDecoration>
                                        )}
                                    </form.AppField>
                                </li>
                                <li>
                                    <form.AppField
                                        name="semanticColors.onPrimary"
                                        listeners={{
                                            onChange: ({ value: primary }) => {
                                                const { secondary, tertiary, quaternary } =
                                                    nextColors(primary ?? "")
                                                form.setFieldValue(
                                                    "semanticColors.onSecondary",
                                                    secondary,
                                                )
                                                form.setFieldValue(
                                                    "semanticColors.onTertiary",
                                                    tertiary,
                                                )
                                                form.setFieldValue(
                                                    "semanticColors.onQuaternary",
                                                    quaternary,
                                                )
                                            },
                                        }}
                                    >
                                        {(field) => (
                                            <FieldDecoration field={field} label="Foreground">
                                                <field.ColorField />
                                            </FieldDecoration>
                                        )}
                                    </form.AppField>
                                </li>
                            </>
                        )}
                        {semanticColorsKeys.map((key, index) => (
                            <li key={`semanticColors[${key}@${index}]`}>
                                <form.AppField name={`semanticColors.${key}`}>
                                    {(field) => (
                                        <FieldDecoration
                                            field={field}
                                            label={camelCaseToTitleCase(key)}
                                        >
                                            <field.ColorField />
                                        </FieldDecoration>
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
