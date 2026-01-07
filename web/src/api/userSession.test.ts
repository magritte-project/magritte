import { describe, expect, it, vi } from "vitest"

import { StorageUserSessionManager, UserSessionManager } from "./userSession"

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

describe("userSession", () => {
    describe("#UserSessionManager", () => {
        it("should raise for abstract members", () => {
            const subject = new UserSessionManager()
            expect(() => subject.current).toThrowError()
            expect(() => {
                subject.current = null
            }).toThrowError()
        })
    })

    describe("#StorageUserSessionManager", () => {
        it("should post currentDidChange event", async () => {
            const subject = new StorageUserSessionManager(mockStorage())
            let didPost = false
            subject.$events.subscribe((event) => {
                expect(event.type).toStrictEqual("currentDidChange")
                didPost = true
            })
            subject.current = { accessToken: "<NOISE>", scopes: [] }
            expect(didPost).toStrictEqual(true)
        })
    })
})
