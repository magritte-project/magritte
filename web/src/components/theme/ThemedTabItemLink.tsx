import { createLink, type LinkComponent } from "@tanstack/react-router"
import classNames from "classnames"
import React from "react"

import type { ThemedTabItemLabelProps } from "@/components/theme/ThemedTabItemLabel"
import ThemedTabItemLabel from "@/components/theme/ThemedTabItemLabel"

interface BasicLinkProps
    extends
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        Pick<ThemedTabItemLabelProps, "icon" | "label" | "alwaysInline"> {
    readonly ref?: React.Ref<HTMLAnchorElement>
}

const BasicLink = createLink(function BasicLink(props: BasicLinkProps) {
    return <a {...props} />
})

const ThemedTabItemLink: LinkComponent<typeof BasicLink> = (props) => {
    return (
        <BasicLink className={classNames("group", props.className)} {...props}>
            {(state) => (
                <ThemedTabItemLabel
                    isActive={state.isActive}
                    icon={props.icon}
                    label={props.label}
                    alwaysInline={props.alwaysInline}
                />
            )}
        </BasicLink>
    )
}

export default ThemedTabItemLink
