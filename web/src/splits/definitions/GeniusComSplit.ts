import { LinkIcon } from "@phosphor-icons/react/dist/ssr"

import type { SplitDefinition } from "@/splits/base"

import GeniusComTester from "@/components/extensions/GeniusComTester"

export const GeniusComSplit: SplitDefinition = {
    id: "geniusCom",
    name: "Genius",
    icon: LinkIcon,
    minWidth: "16rem",
    preferredLocation: "end",
    allowsMultiple: false,
    requiresParameters: false,
    component: GeniusComTester,
}
