import { Radio, type RadioProps } from "@headlessui/react"
import { CircleIcon } from "@phosphor-icons/react"
import classNames from "classnames"

export type ThemedRadioProps<TType = string> = Omit<RadioProps<"span", TType>, "children">

export default function ThemedRadio<TType = string>({
    className,
    ...rest
}: ThemedRadioProps<TType>) {
    return (
        <Radio
            className={classNames(
                "group flex items-center justify-center p-sm",
                "bg-primary data-checked:bg-key data-checked:text-on-key",
                "border border-outline data-checked:border-key focus:border-outline-focus rounded-full",
                "aria-disabled:opacity-disabled",
                className,
            )}
            {...rest}
        >
            <CircleIcon
                className="opacity-0 group-data-checked:opacity-100"
                weight="fill"
                size="0.5em"
                aria-hidden
            />
        </Radio>
    )
}
