import React, { useCallback, useState } from "react"

export interface UseStorageValueOptions<TValue> {
    readonly parse?: (json: string) => TValue
    readonly stringify?: (value: TValue) => string
    readonly storage?: Storage
}

export type UseStorageValueResult<TValue> = [TValue, React.Dispatch<React.SetStateAction<TValue>>]

export default function useStorageValue<TValue>(
    key: string,
    defaultValue: TValue | (() => TValue),
    {
        parse = JSON.parse,
        stringify = JSON.stringify,
        storage = localStorage,
    }: UseStorageValueOptions<TValue> = {},
): UseStorageValueResult<TValue> {
    const [value, setTransientValue] = useState(() => {
        const storedValue = storage.getItem(key)
        if (storedValue !== null) {
            try {
                return parse(storedValue)
            } catch (error) {
                console.error("*** Could not parse value for ${key} from storage:", error)
            }
        }
        return typeof defaultValue === "function" ? (defaultValue as () => TValue)() : defaultValue
    })
    const setValue = useCallback(
        (newValue: React.SetStateAction<TValue>) => {
            setTransientValue((oldValue) => {
                const nextValue =
                    typeof newValue === "function"
                        ? (newValue as (oldValue: TValue) => TValue)(oldValue)
                        : newValue
                storage.setItem(key, stringify(nextValue))
                return nextValue
            })
        },
        [key, stringify, storage],
    )
    return [value, setValue]
}
