import { useEffect, useState } from "react"

/** A value which only changes once it has held still for a while */
export default function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timeout = setTimeout(() => setDebounced(value), delayMs)
        return () => clearTimeout(timeout)
    }, [value, delayMs])
    return debounced
}
