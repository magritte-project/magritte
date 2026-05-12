import classNames from "classnames"
import React from "react"

export interface ThemedAnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

const ThemedAnchorComponent = React.forwardRef<HTMLAnchorElement, ThemedAnchorProps>(
    ({ className, ...rest }, ref) => {
        return (
            <a
                ref={ref}
                {...rest}
                className={classNames("text-blue-500 active:text-blue-400 font-bold", className)}
            />
        )
    },
)

export default ThemedAnchorComponent
