import { useCallback } from "react"

import { secondaryButtonClassName } from "@/components/reusable/buttonStyles"
import ListSection from "@/components/reusable/ListSection"
import SignInButton from "@/components/SignInButton"
import useLastfmAccount from "@/hooks/accountHook"
import useExtensionHost from "@/hooks/extensionHostHook"
import useLastfm from "@/hooks/lastfmHook"
import usePendingScrobbleCount from "@/hooks/pendingScrobblesHook"

export default function Settings() {
    const { account } = useLastfm()
    const { session, isScrobblingEnabled } = useLastfmAccount()
    const pendingCount = usePendingScrobbleCount()
    const extensionHost = useExtensionHost()
    // Closing only dismisses this extension, any others stay in the panel
    const handleClose = useCallback(async () => {
        await extensionHost.requestClose()
    }, [extensionHost])

    return (
        <>
            <ListSection title="Account">
                <li className="flex items-center gap-2 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                        {session !== null ? (
                            <>
                                Signed in as <span className="font-semibold">{session.name}</span>
                            </>
                        ) : (
                            "Not signed in to Last.fm"
                        )}
                    </div>
                    <SignInButton showStatus={false} />
                </li>
            </ListSection>
            <ListSection title="Scrobbling">
                <li className="flex items-center gap-2 px-3 py-2 text-sm">
                    <label className="flex flex-1 items-center gap-2" htmlFor="scrobbling-enabled">
                        <span className="flex-1">Scrobble what you play</span>
                    </label>
                    <input
                        id="scrobbling-enabled"
                        type="checkbox"
                        className="h-4 w-4 accent-[#b90000]"
                        checked={isScrobblingEnabled}
                        onChange={(e) => account.setScrobblingEnabled(e.currentTarget.checked)}
                    />
                </li>
                {pendingCount > 0 && (
                    <li className="px-3 py-2 text-xs text-gray-500">
                        {pendingCount} scrobble
                        {pendingCount === 1 ? "" : "s"} waiting to be submitted
                    </li>
                )}
            </ListSection>
            <ListSection title="Extension">
                <li className="flex items-center gap-2 px-3 py-2 text-sm">
                    <div className="flex-1">Hide Last.fm until you open it again</div>
                    <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={handleClose}
                    >
                        Close
                    </button>
                </li>
            </ListSection>
        </>
    )
}
