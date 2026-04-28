import { PencilIcon } from "@phosphor-icons/react"

import type { SplitDefinition } from "@/splits/base"

import SongEditor from "@/components/SongEditor"

export const SongEditorSplit: SplitDefinition = {
    id: "songEditor",
    name: "Edit Song",
    icon: PencilIcon,
    minWidth: "16rem",
    preferredLocation: "start",
    allowsMultiple: true,
    requiresParameters: true,
    component: SongEditor,
}
