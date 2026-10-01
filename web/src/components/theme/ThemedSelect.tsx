import { Select } from "@headlessui/react"
import classNames from "classnames"

export type ThemedSelectOptions = React.SelectHTMLAttributes<HTMLSelectElement>

export default function ThemedSelect({ className, ...rest }: ThemedSelectOptions) {
    return (
        <Select
            className={classNames(
                "px-lg py-md flex items-center gap-xs",
                "rounded-input bg-secondary active:bg-secondary-active data-open:bg-secondary-active",
                "font-bold disabled:opacity-disabled drop-shadow-xs",
                className,
            )}
            {...rest}
        />
    )
}
