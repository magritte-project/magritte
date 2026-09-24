import { describe, expect, it } from "vitest"

import { createDeferred, PendingDeferredError } from "./utilities"

describe("utilities", () => {
    describe("#createDeferred", () => {
        it("should throw if the deferred value is still pending", () => {
            const { deferred } = createDeferred<number>()
            expect(deferred.status).toStrictEqual("pending")
            expect(() => deferred.get()).toThrow(PendingDeferredError)
        })

        it("should return value if resolved", () => {
            const { deferred, resolve } = createDeferred<number>()
            resolve(42)
            expect(deferred.status).toStrictEqual("resolved")
            expect(deferred.get()).toStrictEqual(42)
        })

        it("should throw if rejected", () => {
            const { deferred, reject } = createDeferred<number>()
            reject(new Error("Your card's been rejected"))
            expect(deferred.status).toStrictEqual("rejected")
            expect(() => deferred.get()).toThrow("Your card's been rejected")
        })
    })
})
