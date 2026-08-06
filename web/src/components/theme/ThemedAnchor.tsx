import classNames from "classnames"
import React from "react"

export interface ThemedAnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

const ThemedAnchorComponent = React.forwardRef<HTMLAnchorElement, ThemedAnchorProps>(
    ({ className, ...rest }, ref) => {
        return (
            <a
                ref={ref}
                {...rest}
                className={classNames(
                    "text-key active:text-key-active font-bold disabled:opacity-disabled",
                    className,
                )}
            />
        )
    },
)

export default ThemedAnchorComponent
