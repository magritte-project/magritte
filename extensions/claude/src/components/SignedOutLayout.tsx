import classNames from "classnames"
import { useState } from "react"

export interface SignedOutLayoutProps {
    readonly apiKey: string | null
    readonly setApiKey: React.Dispatch<React.SetStateAction<string | null>>
}

export default function SignedOutLayout({ apiKey, setApiKey }: SignedOutLayoutProps) {
    const [newApiKey, setNewApiKey] = useState(apiKey ?? "")

    return (
        <div className="flex flex-col gap-3 p-3">
            <h1 className="font-bold text-lg">Claude API key</h1>
            <p className="text-sm">You must provide a Claude API key to use this extension.</p>
            <input
                type="text"
                placeholder="API key"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className={classNames(
                    "bg-white rounded-lg p-2 min-w-0 w-auto",
                    "text-gray-950 placeholder:text-black/40",
                    "border border-gray-300 focus:border-blue-500 outline-0",
                )}
            />
            <button
                type="button"
                disabled={!newApiKey}
                onClick={() => setApiKey(newApiKey)}
                className={classNames(
                    "bg-blue-500 active:bg-blue-400 disabled:bg-blue-200",
                    "text-slate-50 active:text-white font-bold",
                    "px-4 py-2 rounded-full",
                )}
            >
                Authorize
            </button>
        </div>
    )
}
