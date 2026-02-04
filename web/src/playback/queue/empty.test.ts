import { describe, expect, it } from "vitest"

import EmptyQueue from "./empty"
import { mockTestItem, type TestItem } from "./testing"

describe("EmptyQueue", () => {
    describe("hasItem", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            await expect(subject.hasItem(mockTestItem())).resolves.toBe(false)
        })
    })

    describe("#firstItem", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            await expect(subject.firstItem()).resolves.toBeNull()
        })
    })

    describe("#lastItem", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            await expect(subject.lastItem()).resolves.toBeNull()
        })
    })

    describe("#randomItem", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            await expect(
                subject.randomItem({
                    getNumberOfPlayedItems: async () => 0,
                    hasPlayedItem: async (_item: TestItem) => false,
                    randomIndex: async (length: number) => Math.floor(Math.random() * length),
                }),
            ).resolves.toBeNull()
        })
    })

    describe("#itemPreceding", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            await expect(subject.itemPreceding(mockTestItem())).resolves.toBeNull()
        })
    })

    describe("#itemFollowing", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            await expect(subject.itemFollowing(mockTestItem())).resolves.toBeNull()
        })
    })
})
