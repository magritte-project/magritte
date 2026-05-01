export function search<Rest extends any[]>(term: string, ...rest: Rest) {
    return ["search", term, ...rest] as const
}
