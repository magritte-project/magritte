import { useCallback, useState } from "react"

export interface AsyncButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
    readonly onClick?: (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => undefined | Promise<unknown>
}

export default function AsyncButton({
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
        <button
            onClick={onClick ? handleClick : undefined}
            disabled={isPending || disabled}
            {...rest}
        />
    )
}
