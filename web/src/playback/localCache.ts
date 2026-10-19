import type { API, SourceRead } from "@magritte/api"
import { openDB, type DBSchema, type IDBPDatabase } from "idb"

import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"
import { resolveResourceUrl } from "@/utilities/resources"

interface LocalCacheStoreDB extends DBSchema {
    sourceFiles: {
        key: string
        value: {
            url: string
            id: number
            contents: Blob
            lastModified: Date
        }
        indexes: {
            id: number
            lastModified: Date
        }
    }
}

export type LocalCacheStoreEvent =
    | { type: "sourceFilePut"; url: string }
    | { type: "sourceFileDelete"; url: string }

export class LocalCacheStore {
    static async open(): Promise<LocalCacheStore> {
        const db = await openDB<LocalCacheStoreDB>("LocalCacheStore", 1, {
            upgrade(db) {
                const sourceFiles = db.createObjectStore("sourceFiles", {
                    keyPath: "url" satisfies keyof LocalCacheStoreDB["sourceFiles"]["value"],
                })
                sourceFiles.createIndex(
                    "id",
                    "id" satisfies keyof LocalCacheStoreDB["sourceFiles"]["value"],
                )
                sourceFiles.createIndex(
                    "lastModified",
                    "lastModified" satisfies keyof LocalCacheStoreDB["sourceFiles"]["value"],
                )
            },
        })
        return new LocalCacheStore(db)
    }

    private readonly _dispatch: EventDispatch<LocalCacheStoreEvent>

    private constructor(private readonly db: IDBPDatabase<LocalCacheStoreDB>) {
        ;[this._dispatch, this.subscribe] = createEvent({
            label: "LocalCache",
            awaitSubscribers: false,
        })
    }

    readonly subscribe: EventSubscribe<LocalCacheStoreEvent>

    async hasSourceFile(url: string): Promise<boolean> {
        return (await this.db.count("sourceFiles", url)) > 0
    }

    async intersectionSourceFileUrls(urls: Iterable<string>): Promise<Set<string>> {
        const foundNames = new Set<string>()
        const allNames = new Set(await this.db.getAllKeys("sourceFiles"))
        for (const name of urls) {
            if (allNames.has(name)) {
                foundNames.add(name)
            }
        }
        return foundNames
    }

    async getAllSourceFileUrls(): Promise<string[]> {
        return await this.db.getAllKeys("sourceFiles")
    }

    async getSourceFile(url: string, maxAge?: number): Promise<Blob | undefined> {
        const sourceFile = await this.db.get("sourceFiles", url)
        if (sourceFile === undefined) {
            return undefined
        }
        if (maxAge !== undefined && Date.now() - sourceFile.lastModified.getTime() > maxAge) {
            await this.db.delete("sourceFiles", url)
            void this._dispatch({ type: "sourceFileDelete", url })
            return undefined
        }
        return sourceFile.contents
    }

    async deleteSourceFile(url: string): Promise<void> {
        await this.db.delete("sourceFiles", url)
        void this._dispatch({ type: "sourceFileDelete", url })
    }

    async putSourceFile(
        url: string,
        id: number,
        contents: Blob,
        lastModified = new Date(),
    ): Promise<void> {
        if (!(await navigator.storage.persisted())) {
            if (!(await navigator.storage.persist())) {
                console.warn("*** Local cache may not be reliable")
            }
        }
        const { quota, usage } = await navigator.storage.estimate()
        if (quota !== undefined && usage !== undefined && usage + contents.size > quota) {
            throw new Error("Local storage is full")
        }

        await this.db.put("sourceFiles", {
            url,
            id,
            contents,
            lastModified,
        })
        void this._dispatch({ type: "sourceFilePut", url })
    }
}

export interface LocalStoreOptions {
    readonly api: API
    readonly storage?: Storage
}

export interface LocalStoreDownloadManyOptions {
    readonly sources: readonly SourceRead[]
    readonly onSkipUpToDate?: (source: SourceRead) => void
    readonly onBeginDownload?: (source: SourceRead) => void
    readonly onEndDownload?: (source: SourceRead) => void
    readonly onDownloadError?: (source: SourceRead, error: unknown) => void
}

export class LocalCache {
    static async open({
        api,
        storage = globalThis.localStorage,
    }: LocalStoreOptions): Promise<LocalCache> {
        return new LocalCache(api, storage, await LocalCacheStore.open())
    }

    private readonly _api: API
    private readonly _storage: Storage

    private constructor(api: API, storage: Storage, store: LocalCacheStore) {
        this._api = api
        this._storage = storage
        this.store = store
    }

    readonly store: LocalCacheStore

    get lastSync(): Date | null {
        const rawLastSync = this._storage.getItem("localCache.lastSync")
        if (rawLastSync === null) {
            return null
        }
        return new Date(rawLastSync)
    }

    async downloadMany({
        sources,
        onSkipUpToDate,
        onBeginDownload,
        onEndDownload,
        onDownloadError,
    }: LocalStoreDownloadManyOptions): Promise<number> {
        const fileSources = sources.filter((source) => source.url.startsWith("magritte://"))
        if (fileSources.length === 0) {
            return 0
        }

        const existingUrls = await this.store.intersectionSourceFileUrls(
            fileSources.map((source) => source.url),
        )
        const lastSync = this.lastSync
        const sourceChanges =
            lastSync !== null && existingUrls.size > 0
                ? await this._api.client.readSourceChanges({
                      since: lastSync.toISOString(),
                      ids: fileSources
                          .filter((source) => existingUrls.has(source.url))
                          .map((source) => source.id),
                  })
                : undefined
        let downloadCount = 0
        for (const fileSource of fileSources) {
            if (existingUrls.has(fileSource.url) && !sourceChanges?.ids.includes(fileSource.id)) {
                onSkipUpToDate?.(fileSource)
                continue
            }
            onBeginDownload?.(fileSource)
            try {
                const token = await this._api.fileAccess.token()
                const url = resolveResourceUrl(fileSource.url, token)
                if (url === undefined) {
                    throw new Error("Could not resolve song source URL")
                }
                const response = await fetch(url)
                const contents = await response.blob()
                await this.store.putSourceFile(fileSource.url, fileSource.id, contents)
                downloadCount++
                onEndDownload?.(fileSource)
            } catch (error) {
                onDownloadError?.(fileSource, error)
            }
        }
        return downloadCount
    }
}
