export type SortableKey<Key extends string> = `+${Key}` | `-${Key}`

export function getKey<Key extends string>(key: SortableKey<Key>): Key {
    return key.slice(1) as Key
}

export function isAscending<Key extends string>(key: SortableKey<Key>): boolean {
    return key.startsWith("+")
}

export function reverseOrder<Key extends string>(key: SortableKey<Key>): SortableKey<Key> {
    return key.startsWith("+") ? `-${getKey(key)}` : `+${getKey(key)}`
}
