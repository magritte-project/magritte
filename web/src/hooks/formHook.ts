import { createFormHook } from "@tanstack/react-form"

import InputField from "@/components/fieldComponents/InputField"
import TextareaField from "@/components/fieldComponents/TextareaField"
import SubmitButton from "@/components/formComponents/SubmitButton"
import { fieldContext, formContext } from "@/contexts/formContext"

export const { withFieldGroup, withForm, useAppForm } = createFormHook({
    fieldComponents: {
        InputField,
        TextareaField,
    },
    fieldContext,
    formComponents: {
        SubmitButton,
    },
    formContext,
})
