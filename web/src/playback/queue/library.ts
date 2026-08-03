import type { API, LibraryMediaReadSongRead } from "@magritte/api"
import type { PlayableItem } from "@magritte/sdk"
import type { QueryClient } from "@tanstack/react-query"

import { readLibrarySongs, type ReadLibrarySongsCriteria } from "@/api/queries/libraries"
import type { Queue, QueueContext, QueueEvent, RandomItemContext } from "@/playback/queue/base"
import { createEvent, type EventStream } from "@/utilities/events"

export default class LibraryQueue implements Queue<PlayableItem> {
    private readonly _api: API
    private readonly _queryClient: QueryClient
    private readonly _criteria: Omit<ReadLibrarySongsCriteria, "offset" | "limit">
    private readonly _pages: Map<number, LibraryMediaReadSongRead>
    private _limit: number
    private _total: number

    constructor(
        context: QueueContext,
        initialPage: LibraryMediaReadSongRead,
        criteria: ReadLibrarySongsCriteria,
    ) {
        ;[, this.$events] = createEvent<QueueEvent>()

        // TODO: Wire up events

        this._api = context.api
        this._queryClient = context.queryClient
        this._criteria = { ...criteria }
        this._pages = new Map().set(initialPage.offset, initialPage)
        this._limit = initialPage.limit
        this._total = initialPage.total
    }

    /**
     * The offset of the last page which has items.
     */
    private get _lastPageOffset(): number {
        return this._limit * Math.floor(this._total / this._limit)
    }

    private async _pageAt(offset: number): Promise<LibraryMediaReadSongRead> {
        const existingPage = this._pages.get(offset)
        if (existingPage !== undefined) {
            return existingPage
        } else {
            const newPage = await this._queryClient.ensureQueryData(
                readLibrarySongs(this._api, {
                    ...this._criteria,
                    offset,
                }),
            )
            this._pages.set(offset, newPage)
            return newPage
        }
    }

    /**
     * Enumerate all pages matching the library criteria,
     * loading any pages which are not already locally cached.
     *
     * The pages *are not* guaranteed to be returned in chronological order.
     * Already cached pages are visited first to avoid network activity when
     * not required.
     */
    private async *_allPages(): AsyncGenerator<[number, LibraryMediaReadSongRead]> {
        const visitedOffsets = new Set<number>()
        for (const [offset, page] of this._pages) {
            visitedOffsets.add(offset)
            yield [offset, page]
        }
        for (
            let offset = 0, lastPageOffset = this._lastPageOffset;
            offset < lastPageOffset;
            offset += this._limit
        ) {
            if (visitedOffsets.has(offset)) {
                continue
            }
            const page = await this._pageAt(offset)
            yield [offset, page]
        }
    }

    private async _pageOffsetAndIndexForItem(item: PlayableItem): Promise<[number, number]> {
        for await (const [offset, page] of this._allPages()) {
            const index = page.items.findIndex((candidate) => candidate.id === item.id)
            if (index !== -1) {
                return [offset, index]
            }
        }
        return [-1, -1]
    }

    readonly $events: EventStream<QueueEvent>

    async hasItem(item: PlayableItem): Promise<boolean> {
        for await (const [, page] of this._allPages()) {
            if (page.items.some((candidate) => candidate.id === item.id)) {
                return true
            }
        }
        return false
    }

    async firstItem(): Promise<PlayableItem | null> {
        const firstPage = await this._pageAt(0)
        if (firstPage.items.length > 0) {
            return firstPage.items[0]
        } else {
            return null
        }
    }

    async lastItem(): Promise<PlayableItem | null> {
        const lastPage = await this._pageAt(this._lastPageOffset)
        if (lastPage.items.length > 0) {
            return lastPage.items[0]
        } else {
            return null
        }
    }

    async randomItem({
        getNumberOfPlayedItems,
        hasPlayedItem,
        randomIndex,
    }: RandomItemContext<PlayableItem>): Promise<PlayableItem | null> {
        const maxAttempts = Math.max(0, this._total - (await getNumberOfPlayedItems()))
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const offset = await randomIndex(this._pages.size)
            const page = await this._pageAt(offset)
            const index = await randomIndex(page.items.length)
            const item = page.items[index]
            if (!(await hasPlayedItem(item))) {
                return item
            }
        }
        return null
    }

    async itemPreceding(item: PlayableItem): Promise<PlayableItem | null> {
        const [offset, index] = await this._pageOffsetAndIndexForItem(item)
        if (offset === -1 || index === -1) {
            throw new Error(`Could not find item ${item.id}`)
        }
        if (index === 0) {
            if (offset === 0) {
                return null
            }
            const previousPage = await this._pageAt(offset - this._limit)
            return previousPage.items[previousPage.items.length - 1]
        } else {
            const currentPage = await this._pageAt(offset)
            return currentPage.items[index - 1]
        }
    }

    async itemFollowing(item: PlayableItem): Promise<PlayableItem | null> {
        const [offset, index] = await this._pageOffsetAndIndexForItem(item)
        if (offset === -1 || index === -1) {
            throw new Error(`Could not find item ${item.id}`)
        }
        const currentPage = await this._pageAt(offset)
        if (index === currentPage.items.length - 1) {
            if (offset === this._lastPageOffset) {
                return null
            }
            const nextPage = await this._pageAt(offset + this._limit)
            return nextPage.items[0]
        } else {
            return currentPage.items[index + 1]
        }
    }
}
