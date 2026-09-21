import type { API } from "@magritte/api"
import {
    LibraryInputSchema,
    type SearchQuery,
    type SearchResponder,
    type SearchResult,
    type SearchResultActionRequest,
} from "@magritte/sdk"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { CommandInputs } from "@/commands/inputs/base"
import {
    buildLibraryID,
    parseLibraryID,
    type LibrarySearchResponderOptions,
} from "@/search/responders/library"

export class LibrarySongsSearchResponder implements SearchResponder {
    private readonly _router: RegisteredRouter
    private readonly _api: API
    private readonly _commandInputs: CommandInputs

    constructor({ router, api, commandInputs }: LibrarySearchResponderOptions) {
        this._router = router
        this._api = api
        this._commandInputs = commandInputs
    }

    async search({ query }: SearchQuery): Promise<SearchResult[]> {
        const libraryInputs = this._commandInputs.allOf(LibraryInputSchema)
        if (libraryInputs.length === 0) {
            return []
        }
        const libraryId = libraryInputs[0].id
        const librarySongs = await this._api.client.readLibrarySongs(libraryId, { query })
        return librarySongs.items.map((song) => ({
            id: buildLibraryID(libraryId, "song", song.id),
            icon: undefined,
            title: song.title ?? "--",
            subtitle: `${song.album_title ?? "--"} by ${song.artist_name ?? "--"}`,
            canReveal: false,
            canPlay: false,
            canAdd: false,
        }))
    }

    async executeResultAction({ id, action }: SearchResultActionRequest): Promise<void> {
        switch (action) {
            case "add": {
                console.error("Cannot add song already in library", id)
                break
            }
            case "play": {
                // TODO: implement play action
                break
            }
            case "reveal": {
                // TODO: This doesn't reveal specific song
                const { libraryId } = parseLibraryID(id)
                this._router.navigate({
                    to: "/libraries/$libraryId/songs",
                    params: { libraryId: String(libraryId) },
                })
                break
            }
        }
    }
}
