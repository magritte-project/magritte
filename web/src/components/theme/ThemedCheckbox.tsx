import { Checkbox, type CheckboxProps } from "@headlessui/react"
import { CheckIcon } from "@phosphor-icons/react"
import classNames from "classnames"

export type ThemedCheckboxProps = Omit<CheckboxProps, "children">

/** The box every checkbox is drawn in; shared so sibling controls can match its dimensions. */
export const themedCheckboxBoxClassName = classNames(
    "flex items-center justify-center p-0.5",
    "bg-primary border border-outline rounded-md",
)

export default function ThemedCheckbox({ className, ...rest }: ThemedCheckboxProps) {
    return (
        <Checkbox
            className={classNames(
                "group",
                themedCheckboxBoxClassName,
                "data-checked:bg-key data-checked:text-on-key",
                "data-checked:border-key focus:border-outline-focus",
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
