import { describe, expect, it, vi } from "vitest"

import { StorageUserSessionManager } from "./userSession"

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

describe("userSession", () => {
    describe("#StorageUserSessionManager", () => {
        it("should post currentDidChange event", async () => {
            const subject = new StorageUserSessionManager(mockStorage())
            const listener = vi.fn()
            subject.subscribe(listener)
            subject.replaceSession({ accessToken: "<NOISE>", scopes: [] })
            expect(listener).toHaveBeenCalled()
        })

        it("should not read localStorage until local is first used", () => {
            // oxlint-disable-next-line typescript/unbound-method
            expect(vi.mocked(localStorage.getItem)).not.toHaveBeenCalled()
            const local = StorageUserSessionManager.local
            // oxlint-disable-next-line typescript/unbound-method
            expect(vi.mocked(localStorage.getItem)).toHaveBeenCalled()
            expect(StorageUserSessionManager.local).toBe(local)
        })
    })
})
