export function catalog<Rest extends any[]>(kind: string, id: string, ...rest: Rest) {
    return ["catalog", kind, id, ...rest] as const
}
