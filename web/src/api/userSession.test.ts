import { describe, expect, it } from "vitest"
import { UserSessionManager } from "./userSession"

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
})
