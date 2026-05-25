import { useSyncExternalStore } from "react"

import useMusicKit from "@/hooks/musicKitHook"

export default function useIsDrmSupported() {
    const musicKit = useMusicKit()
    const isDrmSupported = useSyncExternalStore(
        (onStoreChange) => {
            musicKit.addEventListener("drmUnsupported", onStoreChange)
            return () => {
                musicKit.removeEventListener("drmUnsupported", onStoreChange)
            }
        },
        () => musicKit.browserSupportsVideoDrm,
    )
    return isDrmSupported
}
