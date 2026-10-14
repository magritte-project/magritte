import { useSelector } from "@tanstack/react-form"

import type { ThemedButtonProps } from "@/components/theme/ThemedButton"
import ThemedButton from "@/components/theme/ThemedButton"
import { useFormContext } from "@/contexts/formContext"

export interface SubmitButtonProps extends ThemedButtonProps {}

export default function SubmitButton({
    disabled,
    children = "Submit",
    ...rest
}: SubmitButtonProps) {
    const form = useFormContext()
    const [canSubmit, isSubmitting] = useSelector(form.store, (state) => [
        state.canSubmit,
        state.isSubmitting,
    ])
    return (
        <ThemedButton disabled={disabled || !canSubmit || isSubmitting} {...rest}>
            {children}
        </ThemedButton>
    )
}
