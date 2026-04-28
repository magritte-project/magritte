import { useCallback, useSyncExternalStore } from "react"

import useMusicKit from "@/hooks/musicKitHook"

export interface UseAuthorizationResult {
    readonly isAuthorized: boolean
    readonly authorize: () => Promise<void>
    readonly deauthorize: () => Promise<void>
}

export default function useAuthorization(): UseAuthorizationResult {
    const musicKit = useMusicKit()
    const isAuthorized = useSyncExternalStore(
        (onStoreChange) => {
            musicKit.addEventListener("authorizationStatusDidChange", onStoreChange)
            return () => {
                musicKit.removeEventListener("authorizationStatusDidChange", onStoreChange)
            }
        },
        () => musicKit.isAuthorized,
    )
    const authorize = useCallback(async () => {
        await musicKit.authorize()
    }, [musicKit])
    const deauthorize = useCallback(async () => {
        await musicKit.unauthorize()
    }, [musicKit])
    return { isAuthorized, authorize, deauthorize }
}
