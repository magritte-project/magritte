// @vitest-environment node
import "fake-indexeddb/auto"
import { IDBFactory } from "fake-indexeddb"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LocalCacheStore } from "./localCache"

function mockStorageManager({
    persisted = true,
    persist = true,
    quota = 1_000_000,
    usage = 0,
}: {
    persisted?: boolean
    persist?: boolean
    quota?: number
    usage?: number
} = {}) {
    const storage = {
        persisted: vi.fn().mockResolvedValue(persisted),
        persist: vi.fn().mockResolvedValue(persist),
        estimate: vi.fn().mockResolvedValue({ quota, usage }),
    }
    Object.defineProperty(navigator, "storage", { value: storage, configurable: true })
    return storage
}

function mockStorage() {
    const items = new Map<string, string>()
    return {
        get length(): number {
            return items.size
        },
        clear: vi.fn(() => {
            items.clear()
        }),
        getItem: vi.fn((key: string): string | null => {
            return items.get(key) ?? null
        }),
        key: vi.fn((index: number): string | null => {
            return items.get([...items.keys()][index]) ?? null
        }),
        removeItem: vi.fn((key: string): void => {
            items.delete(key)
        }),
        setItem: vi.fn((key: string, value: string): void => {
            items.set(key, value)
        }),
    } satisfies Storage
}

vi.hoisted(() => {
    vi.stubGlobal("localStorage", mockStorage())
})

describe("localCache", () => {
    describe("#LocalCacheStore", () => {
        beforeEach(() => {
            vi.stubGlobal("indexedDB", new IDBFactory())
            mockStorageManager()
        })

        afterEach(() => {
            vi.unstubAllGlobals()
            vi.restoreAllMocks()
        })

        describe("#open", () => {
            it("should create the sourceFiles store with indexes", async () => {
                await LocalCacheStore.open()

                const db = await new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open("LocalCacheStore")
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })
                const store = db.transaction("sourceFiles").objectStore("sourceFiles")
                expect(store.keyPath).toBe("url")
                expect([...store.indexNames].sort()).toEqual(["id", "lastModified"])
                db.close()
            })
        })

        describe("#hasSourceFile", () => {
            it("should return true for cached files", async () => {
                const cache = await LocalCacheStore.open()
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))

                expect(await cache.hasSourceFile("https://example.com/a.mp3")).toBe(true)
            })

            it("should return false for uncached files", async () => {
                const cache = await LocalCacheStore.open()

                expect(await cache.hasSourceFile("https://example.com/a.mp3")).toBe(false)
            })
        })

        describe("#intersectionSourceFileUrls", () => {
            it("should return only the urls which are cached", async () => {
                const cache = await LocalCacheStore.open()
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))
                await cache.putSourceFile("https://example.com/b.mp3", 2, new Blob(["b"]))

                const cachedUrls = await cache.intersectionSourceFileUrls([
                    "https://example.com/a.mp3",
                    "https://example.com/c.mp3",
                ])

                expect(cachedUrls).toEqual(new Set(["https://example.com/a.mp3"]))
            })
        })

        describe("#getAllSourceFileUrls", () => {
            it("should return the urls of all cached files", async () => {
                const cache = await LocalCacheStore.open()
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))
                await cache.putSourceFile("https://example.com/b.mp3", 2, new Blob(["b"]))

                const urls = await cache.getAllSourceFileUrls()

                expect(urls.sort()).toEqual([
                    "https://example.com/a.mp3",
                    "https://example.com/b.mp3",
                ])
            })

            it("should return an empty array if nothing is cached", async () => {
                const cache = await LocalCacheStore.open()

                expect(await cache.getAllSourceFileUrls()).toEqual([])
            })
        })

        describe("#getSourceFile", () => {
            it("should return the contents of cached files", async () => {
                const cache = await LocalCacheStore.open()
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["contents"]))

                const contents = await cache.getSourceFile("https://example.com/a.mp3")

                expect(await contents?.text()).toBe("contents")
            })

            it("should return undefined for uncached files", async () => {
                const cache = await LocalCacheStore.open()

                expect(await cache.getSourceFile("https://example.com/a.mp3")).toBeUndefined()
            })

            it("should return files younger than the max age", async () => {
                const cache = await LocalCacheStore.open()
                const lastModified = new Date(Date.now() - 1_000)
                await cache.putSourceFile(
                    "https://example.com/a.mp3",
                    1,
                    new Blob(["a"]),
                    lastModified,
                )

                const contents = await cache.getSourceFile("https://example.com/a.mp3", 60_000)

                expect(await contents?.text()).toBe("a")
            })

            it("should evict files older than the max age", async () => {
                const cache = await LocalCacheStore.open()
                const lastModified = new Date(Date.now() - 120_000)
                await cache.putSourceFile(
                    "https://example.com/a.mp3",
                    1,
                    new Blob(["a"]),
                    lastModified,
                )

                const contents = await cache.getSourceFile("https://example.com/a.mp3", 60_000)

                expect(contents).toBeUndefined()
                expect(await cache.hasSourceFile("https://example.com/a.mp3")).toBe(false)
            })

            it("should notify subscribers when evicting files", async () => {
                const cache = await LocalCacheStore.open()
                const lastModified = new Date(Date.now() - 120_000)
                await cache.putSourceFile(
                    "https://example.com/a.mp3",
                    1,
                    new Blob(["a"]),
                    lastModified,
                )
                const subscriber = vi.fn()
                cache.subscribe(subscriber)

                await cache.getSourceFile("https://example.com/a.mp3", 60_000)

                expect(subscriber).toHaveBeenCalledExactlyOnceWith({
                    type: "sourceFileDelete",
                    url: "https://example.com/a.mp3",
                })
            })

            it("should not notify subscribers when returning files", async () => {
                const cache = await LocalCacheStore.open()
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))
                const subscriber = vi.fn()
                cache.subscribe(subscriber)

                await cache.getSourceFile("https://example.com/a.mp3", 60_000)

                expect(subscriber).not.toHaveBeenCalled()
            })
        })

        describe("#deleteSourceFile", () => {
            it("should remove cached files", async () => {
                const cache = await LocalCacheStore.open()
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))
                await cache.putSourceFile("https://example.com/b.mp3", 2, new Blob(["b"]))

                await cache.deleteSourceFile("https://example.com/a.mp3")

                expect(await cache.hasSourceFile("https://example.com/a.mp3")).toBe(false)
                expect(await cache.hasSourceFile("https://example.com/b.mp3")).toBe(true)
            })

            it("should notify subscribers", async () => {
                const cache = await LocalCacheStore.open()
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))
                const subscriber = vi.fn()
                cache.subscribe(subscriber)

                await cache.deleteSourceFile("https://example.com/a.mp3")

                expect(subscriber).toHaveBeenCalledExactlyOnceWith({
                    type: "sourceFileDelete",
                    url: "https://example.com/a.mp3",
                })
            })
        })

        describe("#putSourceFile", () => {
            it("should notify subscribers", async () => {
                const cache = await LocalCacheStore.open()
                const subscriber = vi.fn()
                cache.subscribe(subscriber)

                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))

                expect(subscriber).toHaveBeenCalledExactlyOnceWith({
                    type: "sourceFilePut",
                    url: "https://example.com/a.mp3",
                })
            })

            it("should not notify subscribers if the file is rejected", async () => {
                mockStorageManager({ quota: 10, usage: 8 })
                const cache = await LocalCacheStore.open()
                const subscriber = vi.fn()
                cache.subscribe(subscriber)

                await expect(
                    cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["abc"])),
                ).rejects.toThrow("Local storage is full")

                expect(subscriber).not.toHaveBeenCalled()
            })

            it("should replace existing files with the same url", async () => {
                const cache = await LocalCacheStore.open()
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["old"]))
                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["new"]))

                const contents = await cache.getSourceFile("https://example.com/a.mp3")

                expect(await contents?.text()).toBe("new")
            })

            it("should request persistent storage if not already persisted", async () => {
                const storage = mockStorageManager({ persisted: false })
                const cache = await LocalCacheStore.open()

                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))

                expect(storage.persist).toHaveBeenCalledOnce()
            })

            it("should warn if persistent storage is denied", async () => {
                mockStorageManager({ persisted: false, persist: false })
                const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
                const cache = await LocalCacheStore.open()

                await cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["a"]))

                expect(warn).toHaveBeenCalledWith("*** Local cache may not be reliable")
                expect(await cache.hasSourceFile("https://example.com/a.mp3")).toBe(true)
            })

            it("should reject files which would exceed the storage quota", async () => {
                mockStorageManager({ quota: 10, usage: 8 })
                const cache = await LocalCacheStore.open()

                await expect(
                    cache.putSourceFile("https://example.com/a.mp3", 1, new Blob(["abc"])),
                ).rejects.toThrow("Local storage is full")
                expect(await cache.hasSourceFile("https://example.com/a.mp3")).toBe(false)
            })
        })
    })
})
