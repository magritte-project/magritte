import useCommandPaletteContext from "@/hooks/commandPaletteContext"
import createFuzzySearch from "@nozbe/microfuzz"
import classNames from "classnames"
import { useMemo, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

export default function CommandPalette() {
    const [isPresented, setIsPresented] = useState(false)
    const [queryText, setQueryText] = useState("")
    const { commands } = useCommandPaletteContext()
    const fuzzySearch = useMemo(
        () =>
            createFuzzySearch(commands, {
                getText: (command) => [command.displayName],
            }),
        [commands],
    )
    const results = useMemo(() => {
        return fuzzySearch(queryText)
    }, [fuzzySearch, queryText])
    useHotkeys("ctrl+k", () => {
        setIsPresented((oldValue) => !oldValue)
    })
    useHotkeys(
        "escape",
        () => {
            setIsPresented(false)
        },
        { enabled: isPresented },
    )
    const containerClasses = classNames(
        {
            hidden: !isPresented,
            block: isPresented,
        },
        "absolute absolute top-1/2 left-1/2 -translate-1/2",
        "bg-white border border-gray-300 shadow text-black",
    )
    return (
        isPresented && (
            <div className={containerClasses}>
                <input
                    type="text"
                    className="bg-white p-2"
                    // biome-ignore lint/a11y/noAutofocus: This really should auto focus
                    autoFocus
                    value={queryText}
                    onChange={(e) => setQueryText(e.currentTarget.value)}
                />
                {queryText !== "" && (
                    <ol>
                        {results.map((result) => (
                            <li key={result.item.identifier}>
                                {result.item.displayName}
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        )
    )
}
