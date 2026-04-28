import { CassetteTapeIcon } from "@phosphor-icons/react"

import type { SplitDefinition } from "@/splits/base"

import QuickMix from "@/components/QuickMix"

export const QuickMixSplit: SplitDefinition = {
    id: "quickMix",
    name: "Quick Mix",
    icon: CassetteTapeIcon,
    minWidth: "16rem",
    preferredLocation: "end",
    allowsMultiple: false,
    requiresParameters: false,
    component: QuickMix,
}
