import { LIMIT_MAX, type API, type SourceRead } from "@magritte/api"
import { openDB, type DBSchema, type IDBPDatabase } from "idb"

import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"
import { getPeriodicTaskLastFireDate, MS_PER_HOUR, periodicTask } from "@/utilities/periodicTask"
import { resolveResourceUrl } from "@/utilities/resources"
import { TaskProgressReporter } from "@/utilities/taskProgress"

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

    async *streamAllSourceFileIds(batchCount = 50): AsyncGenerator<number[]> {
        let range: IDBKeyRange | null = null
        for (;;) {
            const ids: number[] = []
            // A key cursor over the `id` index reads index keys without loading values (and their
            // blobs). Each batch gets its own transaction, as one would commit while the caller
            // awaits other work between batches.
            let cursor = await this.db
                .transaction("sourceFiles")
                .store.index("id")
                .openKeyCursor(range, "nextunique")
            while (cursor) {
                ids.push(cursor.key)
                if (ids.length === batchCount) {
                    break
                }
                cursor = await cursor.continue()
            }
            if (ids.length > 0) {
                yield ids
            }
            if (ids.length < batchCount) {
                break
            }
            range = IDBKeyRange.lowerBound(ids[ids.length - 1], true)
        }
    }

    async *streamAllSourceFiles(batchCount: number) {
        let range: IDBKeyRange | null = null
        for (;;) {
            const batch = await this.db.getAll("sourceFiles", range, batchCount)
            if (batch.length === 0) {
                break
            }
            yield batch
            if (batch.length < batchCount) {
                break
            }
            range = IDBKeyRange.lowerBound(batch[batch.length - 1].url, true)
        }
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
    readonly taskProgressReporter: TaskProgressReporter
    readonly storage?: Storage
}

export class LocalCache {
    static async open({
        api,
        taskProgressReporter,
        storage = globalThis.localStorage,
    }: LocalStoreOptions): Promise<LocalCache> {
        return new LocalCache(api, taskProgressReporter, storage, await LocalCacheStore.open())
    }

    private readonly _api: API
    private readonly _storage: Storage
    private readonly _taskProgressReporter: TaskProgressReporter

    private constructor(
        api: API,
        taskProgressReporter: TaskProgressReporter,
        storage: Storage,
        store: LocalCacheStore,
    ) {
        this._api = api
        this._storage = storage
        this._taskProgressReporter = taskProgressReporter
        this.store = store

        periodicTask(() => void this.sync(), {
            interval: MS_PER_HOUR * 6,
            key: "localCache.lastSync",
        })
    }

    readonly store: LocalCacheStore

    get lastSync(): Date | null {
        return getPeriodicTaskLastFireDate("localCache.lastSync", this._storage)
    }

    async sync(): Promise<void> {
        const lastSync = this.lastSync
        if (lastSync !== null) {
            await this._taskProgressReporter.perform(
                {
                    label: "Checking for out of date downloads",
                    totalUnits: 1,
                },
                async () => {
                    for await (const sourceFiles of this.store.streamAllSourceFiles(LIMIT_MAX)) {
                        const sourceChanges = await this._api.client.readSourceChanges({
                            since: lastSync.toISOString(),
                            ids: sourceFiles.map((file) => file.id),
                        })
                        const changedIds = new Set(sourceChanges.ids)
                        if (changedIds.size === 0) {
                            continue
                        }

                        const toRedownload = sourceFiles.filter((sourceFiles) =>
                            changedIds.has(sourceFiles.id),
                        )
                        await this._taskProgressReporter.perform(
                            {
                                label: "Redownloading files",
                                totalUnits: toRedownload.length,
                            },
                            async ({ advance, handledFailure }) => {
                                try {
                                    for (const sourceFile of toRedownload) {
                                        const token = await this._api.fileAccess.token()
                                        const url = resolveResourceUrl(sourceFile.url, token)
                                        if (url === undefined) {
                                            throw new Error("Could not resolve song source URL")
                                        }
                                        const response = await fetch(url)
                                        const contents = await response.blob()
                                        await this.store.putSourceFile(
                                            sourceFile.url,
                                            sourceFile.id,
                                            contents,
                                        )
                                    }
                                } catch (error) {
                                    handledFailure(error)
                                } finally {
                                    advance()
                                }
                            },
                        )
                    }
                },
            )
        }
    }

    async downloadMany(sources: readonly SourceRead[]): Promise<void> {
        const fileSources = sources.filter((source) => source.url.startsWith("magritte://"))
        if (fileSources.length === 0) {
            return
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
        const toDownload = fileSources.filter(
            (fileSource) =>
                !existingUrls.has(fileSource.url) || sourceChanges?.ids.includes(fileSource.id),
        )
        await this._taskProgressReporter.perform(
            {
                label: "Downloading files",
                totalUnits: toDownload.length,
            },
            async ({ advance, handledFailure }) => {
                for (const fileSource of toDownload) {
                    try {
                        const token = await this._api.fileAccess.token()
                        const url = resolveResourceUrl(fileSource.url, token)
                        if (url === undefined) {
                            throw new Error("Could not resolve song source URL")
                        }
                        const response = await fetch(url)
                        const contents = await response.blob()
                        await this.store.putSourceFile(fileSource.url, fileSource.id, contents)
                    } catch (error) {
                        handledFailure(error)
                    } finally {
                        advance()
                    }
                }
            },
        )
    }
}
