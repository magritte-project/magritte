import { useCallback, useState } from "react"

import { DefaultButtonComponent, type ButtonComponent } from "@/components/reusable/ButtonComponent"
import { getErrorMessage } from "@/utilities/errors"

function defaultOnErrorCaught(error: unknown) {
    console.log("AsyncButton caught error", error)
    alert(getErrorMessage(error))
}

export interface AsyncButtonProps extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onClick"
> {
    readonly buttonComponent?: ButtonComponent
    readonly onClick?: (event: React.MouseEvent<HTMLButtonElement>) => undefined | Promise<unknown>
    readonly onErrorCaught?: (error: unknown) => void
}

export default function AsyncButton({
    buttonComponent: Button = DefaultButtonComponent,
    onClick,
    onErrorCaught = defaultOnErrorCaught,
    disabled,
    ...rest
}: AsyncButtonProps) {
    const [isPending, setIsPending] = useState(false)
    const handleClick = useCallback(
        async (event: React.MouseEvent<HTMLButtonElement>) => {
            try {
                setIsPending(true)
                await onClick?.(event)
            } catch (error) {
                onErrorCaught(error)
            } finally {
                setIsPending(false)
            }
        },
        [onClick, onErrorCaught],
    )
    return (
        <Button
            onClick={onClick ? handleClick : undefined}
            disabled={isPending || disabled}
            {...rest}
        />
    )
}
