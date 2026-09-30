import { createFormHook } from "@tanstack/react-form"

import ArtworkSearchField from "@/components/fieldComponents/ArtworkSearchField"
import ColorField from "@/components/fieldComponents/ColorField"
import InputField from "@/components/fieldComponents/InputField"
import SearchInputField from "@/components/fieldComponents/SearchInputField"
import TextareaField from "@/components/fieldComponents/TextareaField"
import SubmitButton from "@/components/formComponents/SubmitButton"
import { fieldContext, formContext } from "@/contexts/formContext"

export const { withFieldGroup, withForm, useAppForm } = createFormHook({
    fieldComponents: {
        ArtworkSearchField,
        ColorField,
        InputField,
        SearchInputField,
        TextareaField,
    },
    fieldContext,
    formComponents: {
        SubmitButton,
    },
    formContext,
})
