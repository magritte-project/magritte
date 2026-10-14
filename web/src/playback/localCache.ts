import { openDB, type DBSchema, type IDBPDatabase } from "idb"

import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"

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

export type LocalCacheEvent =
    | { type: "sourceFilePut"; url: string; id: number }
    | { type: "sourceFileDelete"; url: string; id: number }

export class LocalCache {
    static async open(): Promise<LocalCache> {
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
        return new LocalCache(db)
    }

    private readonly _dispatch: EventDispatch<LocalCacheEvent>

    private constructor(private readonly db: IDBPDatabase<LocalCacheStoreDB>) {
        ;[this._dispatch, this.subscribe] = createEvent({
            label: "LocalCache",
            awaitSubscribers: false,
        })
    }

    readonly subscribe: EventSubscribe<LocalCacheEvent>

    async isSourceFileCached(url: string): Promise<boolean> {
        return (await this.db.count("sourceFiles", url)) > 0
    }

    async getCachedSourceFileUrls(urls: Iterable<string>): Promise<Set<string>> {
        const foundNames = new Set<string>()
        const allNames = new Set(await this.db.getAllKeys("sourceFiles"))
        for (const name of urls) {
            if (allNames.has(name)) {
                foundNames.add(name)
            }
        }
        return foundNames
    }

    async getSourceFile(url: string, maxAge?: number): Promise<Blob | undefined> {
        const sourceFile = await this.db.get("sourceFiles", url)
        if (sourceFile === undefined) {
            return undefined
        }
        if (maxAge !== undefined && Date.now() - sourceFile.lastModified.getTime() > maxAge) {
            await this.db.delete("sourceFiles", url)
            void this._dispatch({ type: "sourceFileDelete", url, id: sourceFile.id })
            return undefined
        }
        return sourceFile.contents
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
        void this._dispatch({ type: "sourceFilePut", url, id })
    }
}
