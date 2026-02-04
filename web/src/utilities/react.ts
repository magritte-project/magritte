export function resolveDefaultValue<TValue>(newValue: TValue | (() => TValue)): TValue {
    return typeof newValue === "function" ? (newValue as () => TValue)() : newValue
}

export function resolveNewValue<TValue>(
    oldValue: TValue,
    newValue: TValue | ((prevState: TValue) => TValue),
): TValue {
    return typeof newValue === "function"
        ? (newValue as (prev: TValue) => TValue)(oldValue)
        : newValue
}
