import { openDB, type DBSchema, type IDBPDatabase } from "idb"

interface LocalFileStoreDB extends DBSchema {
    files: {
        key: string
        value: {
            name: string
            contents: Blob
            lastModified: Date
        }
    }
}

export class LocalCache {
    static async open(): Promise<LocalCache> {
        const db = await openDB<LocalFileStoreDB>("local-file-store", 1, {
            upgrade(db) {
                db.createObjectStore("files", {
                    keyPath: "name",
                })
            },
        })
        return new LocalCache(db)
    }

    private constructor(private readonly db: IDBPDatabase<LocalFileStoreDB>) {}

    async fileExists(name: string): Promise<boolean> {
        return (await this.db.count("files", name)) > 0
    }

    async filesExist(names: Iterable<string>): Promise<Set<string>> {
        const foundNames = new Set<string>()
        const allNames = new Set(await this.db.getAllKeys("files"))
        for (const name of names) {
            if (allNames.has(name)) {
                foundNames.add(name)
            }
        }
        return foundNames
    }

    async getFile(name: string, maxAge?: number): Promise<Blob | undefined> {
        const file = await this.db.get("files", name)
        if (file === undefined) {
            return undefined
        }
        if (maxAge !== undefined && file.lastModified.getTime() - Date.now() > maxAge) {
            await this.db.delete("files", name)
            return undefined
        }
        return file.contents
    }

    async putFile(name: string, contents: Blob, lastModified = new Date()): Promise<void> {
        await this.db.put("files", {
            name,
            contents,
            lastModified,
        })
    }
}
