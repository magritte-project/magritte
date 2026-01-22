import { createLink, type LinkComponent } from "@tanstack/react-router"
import classNames from "classnames"
import React from "react"

import type { ThemedTabItemLabelProps } from "@/components/theme/ThemedTabItemLabel"

import ThemedTabItemLabel from "@/components/theme/ThemedTabItemLabel"

type BasicLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
    Omit<ThemedTabItemLabelProps, "isActive">

const BasicLinkComponent = React.forwardRef<HTMLAnchorElement, BasicLinkProps>((props, ref) => {
    return <a ref={ref} {...props} />
})

const CreatedLinkComponent = createLink(BasicLinkComponent)

const ThemedTabItemLink: LinkComponent<typeof BasicLinkComponent> = (props) => {
    return (
        <CreatedLinkComponent className={classNames("group", props.className)} {...props}>
            {({ isActive }) => (
                <ThemedTabItemLabel isActive={isActive} icon={props.icon} label={props.label} />
            )}
        </CreatedLinkComponent>
    )
}

export default ThemedTabItemLink
