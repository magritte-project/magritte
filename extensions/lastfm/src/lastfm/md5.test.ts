import { describe, expect, it } from "vitest"

import { md5 } from "@/lastfm/md5"

describe("md5", () => {
    it("matches the RFC 1321 test suite", () => {
        expect(md5("")).toBe("d41d8cd98f00b204e9800998ecf8427e")
        expect(md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661")
        expect(md5("abc")).toBe("900150983cd24fb0d6963f7d28e17f72")
        expect(md5("message digest")).toBe("f96b697d7cb7938d525a2f31aaf161d0")
        expect(md5("abcdefghijklmnopqrstuvwxyz")).toBe("c3fcd3d76192e4007dfb496cca67e13b")
        expect(md5("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")).toBe(
            "d174ab98d277d9f5a5611c2c9f419d9f",
        )
        expect(md5("1234567890".repeat(8))).toBe("57edf4a22be3c955ac49da2e2107b67a")
    })

    it("hashes messages which straddle a block boundary", () => {
        // 55, 56, and 64 bytes exercise each padding case
        expect(md5("x".repeat(55))).toBe("04364420e25c512fd958a70738aa8f72")
        expect(md5("x".repeat(56))).toBe("668a72d5ba17f08e62dabcafad6db14b")
        expect(md5("x".repeat(64))).toBe("c1bb4f81d892b2d57947682aeb252456")
    })

    it("hashes non-ASCII text as UTF-8", () => {
        expect(md5("Sigur Rós")).toBe("355a17a3c5a59c1ce50a869065c6cedb")
        expect(md5("Björk")).toBe("7dab4f23a40857b30fdd81370c211680")
    })
})
