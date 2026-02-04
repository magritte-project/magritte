export interface TestItem {
    readonly id: string
}

export function mockTestItem(): TestItem {
    return { id: crypto.randomUUID() }
}
