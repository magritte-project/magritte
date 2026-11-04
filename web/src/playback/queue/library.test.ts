import type { API, APIClient, LibraryMediaReadSongRead, SongRead } from "@magritte/api"
import type { PlayableItem } from "@magritte/sdk"
import { QueryClient } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createSongPlayableItemId, songToPlayableItem } from "@/playback/items"
import type { RandomItemContext } from "@/playback/queue/base"
import LibraryQueue from "@/playback/queue/library"

const LIBRARY_ID = 1

function mockSong(id: number): SongRead {
    return { id, title: `Song ${id}`, end_time: 180 }
}

function mockSongs(count: number): SongRead[] {
    return Array.from({ length: count }, (_, index) => mockSong(index + 1))
}

/** The playable item for the song with an ID, as the queue would produce it */
function itemFor(songId: number): PlayableItem {
    return songToPlayableItem(mockSong(songId))
}

interface Harness {
    readonly queue: LibraryQueue
    readonly queryClient: QueryClient
    /** The songs the fake server pages through, which tests may change */
    songs: SongRead[]
    readonly readLibrarySongs: ReturnType<typeof vi.fn>
}

const queryClients: QueryClient[] = []

afterEach(() => {
    for (const queryClient of queryClients.splice(0)) {
        queryClient.clear()
    }
})

function makeHarness({
    total,
    limit,
    initialOffset = 0,
}: {
    total: number
    limit: number
    initialOffset?: number
}): Harness {
    const songs = mockSongs(total)

    const page = (offset: number): LibraryMediaReadSongRead => ({
        items: songs.slice(offset, offset + limit),
        offset,
        limit,
        total: songs.length,
    })

    const readLibrarySongs = vi.fn<APIClient["readLibrarySongs"]>(
        async (_libraryId, { offset = 0 } = {}) => page(offset),
    )
    const api = { client: { readLibrarySongs } } as unknown as API
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClients.push(queryClient)

    const queue = new LibraryQueue({ api, queryClient }, page(initialOffset), {
        libraryId: LIBRARY_ID,
        offset: initialOffset,
        limit,
    })
    return { songs, queue, queryClient, readLibrarySongs }
}

/** The offsets of every page the queue asked the server for */
function fetchedOffsets(harness: Harness): number[] {
    return harness.readLibrarySongs.mock.calls.map(([, criteria]) => criteria.offset)
}

function randomContext(
    overrides: Partial<RandomItemContext<PlayableItem>> = {},
): RandomItemContext<PlayableItem> {
    return {
        getNumberOfPlayedItems: async () => 0,
        hasPlayedItem: async () => false,
        randomIndex: async (length) => Math.floor(Math.random() * length),
        ...overrides,
    }
}

describe("LibraryQueue", () => {
    describe("#hasItem", () => {
        it("finds items on the initial page without fetching", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.hasItem(itemFor(3))).resolves.toBe(true)
            expect(harness.readLibrarySongs).not.toHaveBeenCalled()
        })

        it("finds items on pages which are not loaded yet", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.hasItem(itemFor(7))).resolves.toBe(true)
        })

        it("finds items on a partial last page", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.hasItem(itemFor(12))).resolves.toBe(true)
        })

        it("finds items on a full last page", async () => {
            const harness = makeHarness({ total: 10, limit: 5 })
            await expect(harness.queue.hasItem(itemFor(10))).resolves.toBe(true)
        })

        it("does not find items outside the library", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.hasItem(itemFor(99))).resolves.toBe(false)
        })

        it("only fetches each page once", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await harness.queue.hasItem(itemFor(99))
            await harness.queue.hasItem(itemFor(99))
            const offsets = fetchedOffsets(harness)
            expect(new Set(offsets).size).toBe(offsets.length)
        })
    })

    describe("#firstItem", () => {
        it("returns the first song in the library", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.firstItem()).resolves.toStrictEqual(itemFor(1))
            expect(harness.readLibrarySongs).not.toHaveBeenCalled()
        })

        it("fetches the first page when the queue started elsewhere", async () => {
            const harness = makeHarness({ total: 12, limit: 5, initialOffset: 5 })
            await expect(harness.queue.firstItem()).resolves.toStrictEqual(itemFor(1))
            expect(fetchedOffsets(harness)).toStrictEqual([0])
        })

        it("returns null for an empty library", async () => {
            const harness = makeHarness({ total: 0, limit: 5 })
            await expect(harness.queue.firstItem()).resolves.toBeNull()
        })
    })

    describe("#lastItem", () => {
        it("returns the last song of a partial last page", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.lastItem()).resolves.toStrictEqual(itemFor(12))
        })

        it("returns the last song of a full last page", async () => {
            const harness = makeHarness({ total: 10, limit: 5 })
            await expect(harness.queue.lastItem()).resolves.toStrictEqual(itemFor(10))
        })

        it("returns the only song in a single page library", async () => {
            const harness = makeHarness({ total: 1, limit: 5 })
            await expect(harness.queue.lastItem()).resolves.toStrictEqual(itemFor(1))
        })

        it("returns null for an empty library", async () => {
            const harness = makeHarness({ total: 0, limit: 5 })
            await expect(harness.queue.lastItem()).resolves.toBeNull()
        })
    })

    describe("#itemFollowing", () => {
        it("returns the next song on the same page", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.itemFollowing(itemFor(2))).resolves.toStrictEqual(itemFor(3))
            expect(harness.readLibrarySongs).not.toHaveBeenCalled()
        })

        it("crosses into the next page", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.itemFollowing(itemFor(5))).resolves.toStrictEqual(itemFor(6))
        })

        it("returns null after the last song of a partial last page", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.itemFollowing(itemFor(12))).resolves.toBeNull()
        })

        it("returns null after the last song of a full last page", async () => {
            const harness = makeHarness({ total: 10, limit: 5 })
            await expect(harness.queue.itemFollowing(itemFor(10))).resolves.toBeNull()
        })

        it("throws for items outside the library", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.itemFollowing(itemFor(99))).rejects.toThrow(
                createSongPlayableItemId(99),
            )
        })
    })

    describe("#itemPreceding", () => {
        it("returns the previous song on the same page", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.itemPreceding(itemFor(3))).resolves.toStrictEqual(itemFor(2))
            expect(harness.readLibrarySongs).not.toHaveBeenCalled()
        })

        it("crosses into the previous page", async () => {
            const harness = makeHarness({ total: 12, limit: 5, initialOffset: 5 })
            await expect(harness.queue.itemPreceding(itemFor(6))).resolves.toStrictEqual(itemFor(5))
        })

        it("returns null before the first song", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.itemPreceding(itemFor(1))).resolves.toBeNull()
        })

        it("throws for items outside the library", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            await expect(harness.queue.itemPreceding(itemFor(99))).rejects.toThrow(
                createSongPlayableItemId(99),
            )
        })
    })

    describe("#randomItem", () => {
        it("returns a song from the library", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            const item = await harness.queue.randomItem(randomContext())
            expect(item).not.toBeNull()
            await expect(harness.queue.hasItem(item!)).resolves.toBe(true)
        })

        it("only fetches whole pages", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            for (let attempt = 0; attempt < 20; attempt++) {
                await harness.queue.randomItem(randomContext())
            }
            for (const offset of fetchedOffsets(harness)) {
                expect(offset % 5).toBe(0)
            }
        })

        it("can return songs from pages which are not loaded yet", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            const item = await harness.queue.randomItem(
                randomContext({ randomIndex: async (length) => length - 1 }),
            )
            expect(item).toStrictEqual(itemFor(12))
        })

        it("skips songs which were already played", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            const played = new Set([createSongPlayableItemId(1)])
            let calls = 0
            const item = await harness.queue.randomItem(
                randomContext({
                    getNumberOfPlayedItems: async () => played.size,
                    hasPlayedItem: async (candidate) => played.has(candidate.id),
                    // The first pick lands on the played song, the second on another
                    randomIndex: async (length) => (calls++ < 2 ? 0 : length - 1),
                }),
            )
            expect(item).not.toBeNull()
            expect(item!.id).not.toBe(createSongPlayableItemId(1))
        })

        it("returns null when every song was played", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            const item = await harness.queue.randomItem(
                randomContext({
                    getNumberOfPlayedItems: async () => 12,
                    hasPlayedItem: async () => true,
                }),
            )
            expect(item).toBeNull()
        })

        it("returns null for an empty library", async () => {
            const harness = makeHarness({ total: 0, limit: 5 })
            await expect(harness.queue.randomItem(randomContext())).resolves.toBeNull()
        })
    })

    describe("#connect", () => {
        it("announces changes to loaded pages", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            const listener = vi.fn()
            harness.queue.subscribe(listener)
            harness.queue.connect()
            await vi.waitFor(() => expect(listener).toHaveBeenCalled())

            listener.mockClear()
            harness.songs[0] = { ...mockSong(1), title: "Renamed" }
            await harness.queryClient.refetchQueries()

            await vi.waitFor(() =>
                expect(listener).toHaveBeenCalledWith({ type: "queueDidChange" }),
            )
            await expect(harness.queue.firstItem()).resolves.toMatchObject({ title: "Renamed" })
            harness.queue.disconnect()
        })

        it("drops loaded pages when the number of songs changes", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            // Load a later page, which will be stale once songs are added
            await harness.queue.hasItem(itemFor(7))
            const listener = vi.fn()
            harness.queue.subscribe(listener)
            harness.queue.connect()
            await vi.waitFor(() => expect(listener).toHaveBeenCalled())

            listener.mockClear()
            harness.songs = [mockSong(100), ...harness.songs]
            await harness.queryClient.refetchQueries({ queryKey: undefined, type: "active" })
            await vi.waitFor(() => expect(listener).toHaveBeenCalled())

            // Song 7 moved to the next page, which has to be fetched again to find it
            await expect(harness.queue.itemFollowing(itemFor(5))).resolves.toStrictEqual(itemFor(6))
            await expect(harness.queue.lastItem()).resolves.toStrictEqual(itemFor(12))
            harness.queue.disconnect()
        })

        it("throws when connected twice", () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            harness.queue.connect()
            expect(() => harness.queue.connect()).toThrow("Queue already connected")
            harness.queue.disconnect()
        })

        it("stops announcing changes once disconnected", async () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            const listener = vi.fn()
            harness.queue.subscribe(listener)
            harness.queue.connect()
            await vi.waitFor(() => expect(listener).toHaveBeenCalled())
            harness.queue.disconnect()

            listener.mockClear()
            harness.songs[0] = { ...mockSong(1), title: "Renamed" }
            await harness.queryClient.refetchQueries()
            expect(listener).not.toHaveBeenCalled()
        })

        it("can connect again after disconnecting", () => {
            const harness = makeHarness({ total: 12, limit: 5 })
            harness.queue.connect()
            harness.queue.disconnect()
            expect(() => harness.queue.connect()).not.toThrow()
            harness.queue.disconnect()
        })
    })
})
