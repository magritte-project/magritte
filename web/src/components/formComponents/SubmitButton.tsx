import { useFormContext } from "@/contexts/formContext"
import { useStore } from "@tanstack/react-form"
import classNames from "classnames"
import type React from "react"

export interface SubmitButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function SubmitButton({
    type = "submit",
    className,
    disabled,
    children = "Submit",
    ...rest
}: SubmitButtonProps) {
    const form = useFormContext()
    const [canSubmit, isSubmitting] = useStore(form.store, (state) => [
        state.canSubmit,
        state.isSubmitting,
    ])
    const buttonClasses = classNames(className)
    return (
        <button
            type={type}
            className="bg-black active:bg-slate-800 text-white font-bold px-3 py-2 rounded-full"
            disabled={disabled || !canSubmit || isSubmitting}
            {...rest}
        >
            {children}
        </button>
    )
}
