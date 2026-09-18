/**
 * MD5, needed because Last.fm signs API calls with it and
 * `crypto.subtle` only implements SHA family digests.
 */

/** Per-round left rotation amounts */
const SHIFTS = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
    14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

/** Per-round additive constants, `floor(abs(sin(i + 1)) * 2^32)` */
const SINES = new Uint32Array(64)
for (let i = 0; i < 64; i++) {
    SINES[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x1_0000_0000)
}

function rotateLeft(value: number, by: number): number {
    return (value << by) | (value >>> (32 - by))
}

/** Pad a message per RFC 1321: a `0x80` byte, zeroes, then the bit length as a 64 bit LE integer */
function pad(message: Uint8Array): Uint8Array {
    const paddedLength = (((message.length + 8) >>> 6) + 1) << 6
    const padded = new Uint8Array(paddedLength)
    padded.set(message)
    padded[message.length] = 0x80
    // Lengths are written as two 32 bit halves, JavaScript bit math cannot reach the high bits
    const bitLength = message.length * 8
    new DataView(padded.buffer).setUint32(paddedLength - 8, bitLength >>> 0, true)
    new DataView(padded.buffer).setUint32(
        paddedLength - 4,
        Math.floor(bitLength / 0x1_0000_0000),
        true,
    )
    return padded
}

/** Compute the MD5 digest of a byte sequence */
export function md5Bytes(message: Uint8Array): Uint8Array {
    const padded = pad(message)
    const words = new DataView(padded.buffer, padded.byteOffset, padded.byteLength)

    let a0 = 0x67452301
    let b0 = 0xefcdab89
    let c0 = 0x98badcfe
    let d0 = 0x10325476

    for (let chunk = 0; chunk < padded.length; chunk += 64) {
        let a = a0
        let b = b0
        let c = c0
        let d = d0

        for (let i = 0; i < 64; i++) {
            let f: number
            let g: number
            if (i < 16) {
                f = (b & c) | (~b & d)
                g = i
            } else if (i < 32) {
                f = (d & b) | (~d & c)
                g = (5 * i + 1) % 16
            } else if (i < 48) {
                f = b ^ c ^ d
                g = (3 * i + 5) % 16
            } else {
                f = c ^ (b | ~d)
                g = (7 * i) % 16
            }
            f = (f + a + SINES[i] + words.getUint32(chunk + g * 4, true)) >>> 0
            a = d
            d = c
            c = b
            b = (b + rotateLeft(f, SHIFTS[i])) >>> 0
        }

        a0 = (a0 + a) >>> 0
        b0 = (b0 + b) >>> 0
        c0 = (c0 + c) >>> 0
        d0 = (d0 + d) >>> 0
    }

    const digest = new Uint8Array(16)
    const digestView = new DataView(digest.buffer)
    digestView.setUint32(0, a0, true)
    digestView.setUint32(4, b0, true)
    digestView.setUint32(8, c0, true)
    digestView.setUint32(12, d0, true)
    return digest
}

/** Compute the MD5 digest of a UTF-8 string, formatted as lowercase hexadecimal */
export function md5(message: string): string {
    return Array.from(md5Bytes(new TextEncoder().encode(message)))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
}
