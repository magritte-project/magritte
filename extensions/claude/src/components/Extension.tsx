import { useLocalStorage } from "@uidotdev/usehooks"

import SignedInLayout from "@/components/SignedInLayout"
import SignedOutLayout from "@/components/SignedOutLayout"

export default function Extension() {
    const [apiKey, setApiKey] = useLocalStorage<string | null>("claude.apiKey", null)

    return apiKey ? (
        <SignedInLayout apiKey={apiKey} onDeauthorize={() => setApiKey(null)} />
    ) : (
        <SignedOutLayout apiKey={apiKey} setApiKey={setApiKey} />
    )
}
