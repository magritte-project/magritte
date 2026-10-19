import type { AnyFormApi } from "@tanstack/react-form"
import { useCallback } from "react"

import { formContext } from "@/contexts/formContext"

export interface AppFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onsubmit"> {
    readonly form: AnyFormApi
}

export default function AppForm({ form, children, ...rest }: AppFormProps) {
    const handleSubmit = useCallback(
        (event: React.SubmitEvent<HTMLFormElement>) => {
            event.stopPropagation()
            event.preventDefault()
            void form.handleSubmit()
        },
        [form],
    )
    return (
        <form onSubmit={handleSubmit} {...rest}>
            <formContext.Provider value={form}>{children}</formContext.Provider>
        </form>
    )
}
