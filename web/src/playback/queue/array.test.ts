import { describe, expect, it, vi } from "vitest"

import ArrayQueue from "./array"

export interface TestItem {
    readonly id: string
}

export function mockTestItem(): TestItem {
    return { id: crypto.randomUUID() }
}

const mockItems: readonly TestItem[] = [mockTestItem(), mockTestItem(), mockTestItem()]

describe("ArrayQueue", () => {
    describe("hasItem", () => {
        it("should return true for items it contains", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            await expect(subject.hasItem(mockItems[0])).resolves.toBe(true)
        })

        it("should return false for items it does not contain", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            await expect(subject.hasItem(mockTestItem())).resolves.toBe(false)
        })
    })

    describe("#firstItem", () => {
        it("should return its first item", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            await expect(subject.firstItem()).resolves.toStrictEqual(mockItems[0])
        })
    })

    describe("#lastItem", () => {
        it("should return its last item", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            await expect(subject.lastItem()).resolves.toStrictEqual(mockItems[mockItems.length - 1])
        })
    })

    describe("#itemPreceding", () => {
        it("should return the preceding item", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            await expect(subject.itemPreceding(mockItems[1])).resolves.toStrictEqual(mockItems[0])
        })

        it("should return null for the first item", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            await expect(subject.itemPreceding(mockItems[0])).resolves.toBeNull()
        })
    })

    describe("#itemFollowing", () => {
        it("should return the following item", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            await expect(subject.itemFollowing(mockItems[0])).resolves.toStrictEqual(mockItems[1])
        })

        it("should return null for the last item", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            await expect(subject.itemFollowing(mockItems[mockItems.length - 1])).resolves.toBeNull()
        })
    })

    describe("#push", () => {
        it("should add items to the end of the queue", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            const newItem1 = mockTestItem()
            const newItem2 = mockTestItem()
            await subject.push(newItem1, newItem2)
            await expect(subject.hasItem(newItem1)).resolves.toBe(true)
            await expect(subject.hasItem(newItem2)).resolves.toBe(true)
        })

        it("should dispatch an event", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            const callback = vi.fn()
            subject.$events(callback)
            await subject.push(mockTestItem())
            expect(callback).toHaveBeenCalledWith({ type: "queueDidChange" })
        })
    })

    describe("removeAt", () => {
        it("should remove the item at the specified index", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            const removedItem = await subject.removeAt(0)
            await expect(subject.hasItem(removedItem)).resolves.toBe(false)
        })

        it("should dispatch an event", async () => {
            const subject = new ArrayQueue<TestItem>(mockItems)
            const callback = vi.fn()
            subject.$events(callback)
            await subject.removeAt(0)
            expect(callback).toHaveBeenCalledWith({ type: "queueDidChange" })
        })
    })
})
