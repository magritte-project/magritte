import InputField from "@/components/fieldComponents/InputField"
import SubmitButton from "@/components/formComponents/SubmitButton"
import { fieldContext, formContext } from "@/contexts/formContext"
import { createFormHook } from "@tanstack/react-form"

export const { withFieldGroup, withForm, useAppForm } = createFormHook({
    fieldComponents: {
        InputField,
    },
    fieldContext,
    formComponents: {
        SubmitButton,
    },
    formContext,
})
