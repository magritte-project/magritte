import { createLink, type LinkComponent } from "@tanstack/react-router"
import classNames from "classnames"
import React from "react"

import type { ThemedSidebarItemLabelProps } from "@/components/theme/ThemedSidebarItemLabel"
import ThemedSidebarItemLabel from "@/components/theme/ThemedSidebarItemLabel"

interface BasicLinkProps
    extends
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        Pick<ThemedSidebarItemLabelProps, "icon" | "label"> {
    readonly ref?: React.Ref<HTMLAnchorElement>
}

const BasicLink = createLink(function BasicLink(props: BasicLinkProps) {
    return <a {...props} />
})

const ThemedSidebarItemLink: LinkComponent<typeof BasicLink> = (props) => {
    return (
        <BasicLink className={classNames("group", props.className)} {...props}>
            {(state) => (
                <ThemedSidebarItemLabel
                    isActive={state.isActive}
                    icon={props.icon}
                    label={props.label}
                />
            )}
        </BasicLink>
    )
}

export default ThemedSidebarItemLink
