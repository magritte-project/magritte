import { LinkIcon } from "@phosphor-icons/react/dist/ssr"

import type { SplitDefinition } from "@/splits/base"

import { buildExtensionComponent } from "@/components/extensions/ExtensionComponent"

export const GeniusComSplit: SplitDefinition = {
    id: "geniusCom",
    name: "Genius",
    icon: LinkIcon,
    minWidth: "16rem",
    preferredLocation: "end",
    allowsMultiple: false,
    requiresParameters: false,
    component: buildExtensionComponent({
        name: "Genius",
        id: "magritte.com.genius",
        version: "0.0.0",
        url: "http://localhost:9292/",
        origin: "http://localhost:9292",
    }),
}
