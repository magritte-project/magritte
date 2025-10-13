import type { ThemedButtonProps } from "@/components/theme/ThemedButton"
import ThemedButton from "@/components/theme/ThemedButton"
import { useFormContext } from "@/contexts/formContext"
import { useStore } from "@tanstack/react-form"

export interface SubmitButtonProps extends ThemedButtonProps {}

export default function SubmitButton({
    disabled,
    children = "Submit",
    ...rest
}: SubmitButtonProps) {
    const form = useFormContext()
    const [canSubmit, isSubmitting] = useStore(form.store, (state) => [
        state.canSubmit,
        state.isSubmitting,
    ])
    return (
        <ThemedButton
            disabled={disabled || !canSubmit || isSubmitting}
            {...rest}
        >
            {children}
        </ThemedButton>
    )
}
