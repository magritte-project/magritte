import { Checkbox, type CheckboxProps } from "@headlessui/react"
import { CheckIcon } from "@phosphor-icons/react"
import classNames from "classnames"

export type LibrarySelectionCheckboxProps = Omit<CheckboxProps, "children">

export default function LibrarySelectionCheckbox({
    className,
    ...rest
}: LibrarySelectionCheckboxProps) {
    return (
        <Checkbox
            className={classNames(
                "group flex items-center justify-center p-0.5",
                "bg-primary data-checked:bg-key data-checked:text-on-key ",
                "border border-outline data-checked:border-key focus:border-outline-focus rounded-md",
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
