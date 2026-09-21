import type { API } from "@magritte/api"
import { LibraryInputSchema } from "@magritte/sdk"

import type { CommandInputs } from "@/commands/inputs/base"
import type { SearchSource, SearchSourceResult } from "@/commands/searchSources/base"

export interface LibrarySongsSearchResponderOptions {
    readonly api: API
}

export class LibrarySongsSearchResponder implements SearchSource {
    private readonly _api: API

    constructor({ api }: LibrarySongsSearchResponderOptions) {
        this._api = api
    }

    get id(): string {
        return "magritte.librarySongs"
    }

    get requiredInputKinds(): readonly string[] {
        return ["library"]
    }

    async search(query: string, inputs: CommandInputs): Promise<SearchSourceResult[]> {
        const libraryInputs = inputs.allOf(LibraryInputSchema)
        if (libraryInputs.length === 0) {
            return []
        }
        const libraryId = libraryInputs[0].id
        const librarySongs = await this._api.client.readLibrarySongs(libraryId, { query })
        return librarySongs.items.map((song) => ({
            id: String(song.id),
            title: song.title ?? "--",
            subtitle: `${song.album_title ?? "--"} by ${song.artist_name ?? "--"}`,
        }))
    }
}
