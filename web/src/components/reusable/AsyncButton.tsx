import { useCallback, useState } from "react"
import {
    DefaultButtonComponent,
    type ButtonComponent,
} from "@/components/reusable/ButtonComponent"

export interface AsyncButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
    readonly buttonComponent?: ButtonComponent
    readonly onClick?: (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => undefined | Promise<unknown>
}

export default function AsyncButton({
    buttonComponent: Button = DefaultButtonComponent,
    onClick,
    disabled,
    ...rest
}: AsyncButtonProps) {
    const [isPending, setIsPending] = useState(false)
    const handleClick = useCallback(
        async (event: React.MouseEvent<HTMLButtonElement>) => {
            const result = onClick?.(event)
            if (result instanceof Promise) {
                try {
                    setIsPending(true)
                    await result
                    setIsPending(false)
                } catch (error) {
                    setIsPending(false)
                    throw error
                }
            }
        },
        [onClick],
    )
    return (
        <Button
            onClick={onClick ? handleClick : undefined}
            disabled={isPending || disabled}
            {...rest}
        />
    )
}
