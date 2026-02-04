export function* lcg(
    initialSeed: number,
    modulus: number = 2 ** 31 - 1,
    a: number = 1103515245,
    c: number = 12345,
): IterableIterator<number> {
    let seed = initialSeed
    for (;;) {
        seed = (a * seed + c) % modulus
        yield seed
    }
}
