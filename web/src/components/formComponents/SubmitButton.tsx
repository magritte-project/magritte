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
    const buttonClasses = classNames(
        "bg-gradient-to-b from-slate-900 to-slate-950 active:from-slate-950",
        "border border-black focus:border-blue-500 outline-0",
        "text-slate-50 active:text-white disabled:text-slate-50/50 font-bold",
        "px-4 py-2 rounded-full",
        className,
    )
    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={disabled || !canSubmit || isSubmitting}
            {...rest}
        >
            {children}
        </button>
    )
}
