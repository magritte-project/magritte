import { describe, expect, it, vi } from "vitest"

import { readTrackMatch } from "@/api/queries/musicbrainz"
import { MusicBrainzClient } from "@/musicbrainz/client"
import searchFixture from "@/musicbrainz/fixtures/recordingSearch.json"

const item = {
    kind: "song" as const,
    id: "1",
    title: "Smells Like Teen Spirit",
    creator: "Nirvana",
    collection: "Nevermind: The Singles",
    endTime: 301.9,
}

describe("readTrackMatch", () => {
    it("searches again without the album when nothing acceptable carried it", async () => {
        const client = new MusicBrainzClient()
        const search = vi
            .spyOn(client, "searchRecordings")
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(
                (await import("@/musicbrainz/parse")).parseRecordingSearch(searchFixture),
            )
        const options = readTrackMatch(client, item)
        const match = await (options.queryFn as () => Promise<unknown>)()

        expect(search).toHaveBeenCalledTimes(2)
        expect(search.mock.calls[0][0].album).toBe("Nevermind: The Singles")
        expect(search.mock.calls[1][0].album).toBeUndefined()
        expect(match).toMatchObject({ recording: { id: "rec-album" } })
    })

    it("skips the lookup for an item with nothing to search for", () => {
        const options = readTrackMatch(new MusicBrainzClient(), {
            kind: "song",
            id: "1",
            endTime: 10,
        })
        expect(typeof options.queryFn).not.toBe("function")
    })
})
