import { CassetteTapeIcon } from "@phosphor-icons/react"

import QuickMix from "@/components/QuickMix"
import type { SplitDefinition } from "@/splits/base"

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
