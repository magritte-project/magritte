import { describe, expect, it } from "vitest"

import EmptyQueue from "./empty"
import { mockQueueItemContext, mockTestItem, type TestItem } from "./testing"

describe("EmptyQueue", () => {
    describe("hasItem", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            expect(subject.hasItem(mockTestItem())).resolves.toBe(false)
        })
    })

    describe("#firstItem", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            expect(subject.firstItem(mockQueueItemContext)).resolves.toBeNull()
        })
    })

    describe("#lastItem", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            expect(subject.lastItem(mockQueueItemContext)).resolves.toBeNull()
        })
    })

    describe("#itemPreceding", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            expect(subject.itemPreceding(mockTestItem(), mockQueueItemContext)).resolves.toBeNull()
        })
    })

    describe("#itemFollowing", () => {
        it("should return null", async () => {
            const subject = new EmptyQueue<TestItem>()
            expect(subject.itemFollowing(mockTestItem(), mockQueueItemContext)).resolves.toBeNull()
        })
    })
})
