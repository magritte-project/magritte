export function assertNever(x: never): never {
    // oxlint-disable-next-line typescript/restrict-template-expressions
    throw new Error(`Unexpected value: ${x}`)
}
