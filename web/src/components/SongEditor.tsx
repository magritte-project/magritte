import { useMemo } from "react"

import type { SplitComponentProps } from "@/splits/base"

export type SongEditorProps = SplitComponentProps

export default function SongEditor({ parameters }: SongEditorProps) {
    const [libraryId, songId] = useMemo(() => {
        const numberParameters = parameters.filter((parameter) => typeof parameter === "number")
        if (numberParameters.length === 2) {
            return numberParameters
        } else {
            return [null, null]
        }
    }, [parameters])
    return (
        <div>
            <h1>Song Editor</h1>
            Song {songId} in library {libraryId}
        </div>
    )
}
