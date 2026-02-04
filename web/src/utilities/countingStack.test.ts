import { describe, expect, it } from "vitest"

import { CountingStack } from "./countingStack"

describe("CountingStack", () => {
    it("should count duplicate items", () => {
        const stack = new CountingStack<{ id: string }, "id">("id")
        stack.push({ id: "1" })
        stack.push({ id: "2" })
        stack.push({ id: "1" })
        expect(stack.count("1")).toBe(2)
        expect(stack.count("2")).toBe(1)
        expect(stack.count("3")).toBe(0)
    })

    it("should allow checking for item membership", () => {
        const stack = new CountingStack<{ id: string }, "id">("id")
        stack.push({ id: "1" })
        stack.push({ id: "2" })
        expect(stack.has("1")).toBe(true)
        expect(stack.has("2")).toBe(true)
        expect(stack.has("3")).toBe(false)
    })

    it("should pop items in LIFO order", () => {
        const stack = new CountingStack<{ id: string }, "id">("id")
        stack.push({ id: "1" })
        stack.push({ id: "2" })
        const popped = stack.pop()
        expect(popped).toStrictEqual({ id: "2" })
        expect(stack.count("1")).toBe(1)
        expect(stack.count("2")).toBe(0)
    })
})
