import type { API, LibraryMediaReadSongRead } from "@magritte/api"
import { type PlayableItem } from "@magritte/sdk"
import { QueryObserver, type QueryClient } from "@tanstack/react-query"

import { readLibrarySongs, type ReadLibrarySongsCriteria } from "@/api/queries/libraries"
import { createSongPlayableItemId, songToPlayableItem } from "@/playback/items"
import type { Queue, QueueContext, QueueEvent, RandomItemContext } from "@/playback/queue/base"
import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"

export default class LibraryQueue implements Queue<PlayableItem> {
    private readonly _dispatch: EventDispatch<QueueEvent>
    private readonly _api: API
    private readonly _queryClient: QueryClient
    private readonly _criteria: Omit<ReadLibrarySongsCriteria, "offset" | "limit">
    private readonly _pages: Map<number, LibraryMediaReadSongRead>
    private _queryObserver: { destroy(): void } | null
    private _limit: number
    private _total: number
    /**
     * When the loaded pages were last dropped, pages cached before then are out of date
     */
    private _pagesResetAt: number

    constructor(
        context: QueueContext,
        initialPage: LibraryMediaReadSongRead,
        criteria: ReadLibrarySongsCriteria,
    ) {
        ;[this._dispatch, this.subscribe] = createEvent({ label: "LibraryQueue" })

        this._api = context.api
        this._queryClient = context.queryClient
        this._criteria = { ...criteria }
        this._pages = new Map().set(initialPage.offset, initialPage)
        this._queryObserver = null
        this._limit = initialPage.limit
        this._total = initialPage.total
        this._pagesResetAt = 0
    }

    /**
     * The offset of the last page which has items, or of the first page when there are none.
     */
    private get _lastPageOffset(): number {
        if (this._total <= 0) {
            return 0
        }
        return this._limit * Math.floor((this._total - 1) / this._limit)
    }

    /**
     * The number of pages which have items, counting an empty library as one empty page.
     */
    private get _pageCount(): number {
        return this._lastPageOffset / this._limit + 1
    }

    private async _pageAt(offset: number): Promise<LibraryMediaReadSongRead> {
        const existingPage = this._pages.get(offset)
        if (existingPage !== undefined) {
            return existingPage
        } else {
            const options = readLibrarySongs(this._api, {
                ...this._criteria,
                offset,
                limit: this._limit,
            })
            // Pages cached before the library changed size hold the wrong songs
            const cachedAt = this._queryClient.getQueryState(options.queryKey)?.dataUpdatedAt ?? 0
            const newPage = await this._queryClient.query({
                ...options,
                staleTime: cachedAt <= this._pagesResetAt ? 0 : "static",
            })
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
            offset <= lastPageOffset;
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
            const index = page.items.findIndex(
                (candidate) => createSongPlayableItemId(candidate.id) === item.id,
            )
            if (index !== -1) {
                return [offset, index]
            }
        }
        return [-1, -1]
    }

    readonly subscribe: EventSubscribe<QueueEvent>

    async hasItem(item: PlayableItem): Promise<boolean> {
        for await (const [, page] of this._allPages()) {
            if (
                page.items.some((candidate) => createSongPlayableItemId(candidate.id) === item.id)
            ) {
                return true
            }
        }
        return false
    }

    async firstItem(): Promise<PlayableItem | null> {
        const firstPage = await this._pageAt(0)
        if (firstPage.items.length > 0) {
            return songToPlayableItem(firstPage.items[0])
        } else {
            return null
        }
    }

    async lastItem(): Promise<PlayableItem | null> {
        const lastPage = await this._pageAt(this._lastPageOffset)
        if (lastPage.items.length > 0) {
            return songToPlayableItem(lastPage.items[lastPage.items.length - 1])
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
            const offset = (await randomIndex(this._pageCount)) * this._limit
            const page = await this._pageAt(offset)
            if (page.items.length === 0) {
                continue
            }
            const index = await randomIndex(page.items.length)
            const item = songToPlayableItem(page.items[index])
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
            return songToPlayableItem(previousPage.items[previousPage.items.length - 1])
        } else {
            const currentPage = await this._pageAt(offset)
            return songToPlayableItem(currentPage.items[index - 1])
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
            return songToPlayableItem(nextPage.items[0])
        } else {
            return songToPlayableItem(currentPage.items[index + 1])
        }
    }

    connect(): void {
        if (this._queryObserver !== null) {
            throw new Error("Queue already connected")
        }

        const queryObserver = new QueryObserver(
            this._queryClient,
            readLibrarySongs(this._api, {
                ...this._criteria,
                limit: this._limit,
            }),
        )
        queryObserver.subscribe((result) => {
            if (result.isSuccess) {
                if (this._pages.has(result.data.offset)) {
                    if (result.data.total !== this._total) {
                        this._pages.clear()
                        this._pagesResetAt = result.dataUpdatedAt
                        this._total = result.data.total
                    }
                    this._pages.set(result.data.offset, result.data)
                    void this._dispatch({ type: "queueDidChange" })
                }
            }
        })
        this._queryObserver = queryObserver
    }

    disconnect(): void {
        this._queryObserver?.destroy()
        this._queryObserver = null
    }
}
