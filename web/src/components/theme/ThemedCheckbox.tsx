import { Checkbox, type CheckboxProps } from "@headlessui/react"
import { CheckIcon } from "@phosphor-icons/react"
import classNames from "classnames"

export type ThemedCheckboxProps = Omit<CheckboxProps, "children">

export default function ThemedCheckbox({ className, ...rest }: ThemedCheckboxProps) {
    return (
        <Checkbox
            className={classNames(
                "group flex items-center justify-center p-xs",
                "bg-primary data-checked:bg-key data-checked:text-on-key",
                "border border-outline data-checked:border-key focus:border-outline-focus rounded-md",
                "aria-disabled:opacity-disabled",
                className,
            )}
            {...rest}
        >
            <CheckIcon
                className="opacity-0 group-data-checked:opacity-100"
                weight="bold"
                size="0.8em"
                aria-hidden
            />
        </Checkbox>
    )
}
