import { getErrorMessage } from "@magritte/rpc"

import {
    primaryButtonClassName,
    secondaryButtonClassName,
} from "@/components/reusable/buttonStyles"
import useLastfmAccount from "@/hooks/accountHook"
import useAuthentication from "@/hooks/authenticationHook"

export interface SignInButtonProps {
    /** Show what sign in is waiting on beneath the button */
    readonly showStatus?: boolean
}

export default function SignInButton({ showStatus = true }: SignInButtonProps) {
    const { session } = useLastfmAccount()
    const { isBusy, authorizationUrl, wasWindowBlocked, error, signIn, signOut, cancel } =
        useAuthentication()

    const button = (
        <button
            type="button"
            className={session !== null ? secondaryButtonClassName : primaryButtonClassName}
            onClick={session !== null ? signOut : signIn}
            disabled={isBusy}
        >
            {session !== null ? "Sign Out" : isBusy ? "Waiting…" : "Sign In"}
        </button>
    )

    if (!showStatus) {
        return button
    }

    return (
        <div className="flex flex-col items-center gap-2">
            {button}
            {authorizationUrl !== null && (
                <div className="flex flex-col items-center gap-1 text-center text-xs text-gray-700">
                    <p>
                        {wasWindowBlocked
                            ? "Your browser blocked the Last.fm window."
                            : "Approve Magritte in the Last.fm window, then come back here."}
                    </p>
                    <a
                        className="font-semibold text-[#b90000] hover:underline"
                        href={authorizationUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        Open Last.fm
                    </a>
                    <button
                        type="button"
                        className="text-gray-500 hover:underline"
                        onClick={cancel}
                    >
                        Cancel
                    </button>
                </div>
            )}
            {error !== null && (
                <p className="text-center text-xs text-[#b90000]">{getErrorMessage(error)}</p>
            )}
        </div>
    )
}
