import { type LinkComponent, createLink } from "@tanstack/react-router"
import ThemedAnchorComponent from "./ThemedAnchor"

const CreatedLinkComponent = createLink(ThemedAnchorComponent)

const ThemedLink: LinkComponent<typeof ThemedAnchorComponent> = (props) => {
    return <CreatedLinkComponent {...props} />
}

export default ThemedLink
