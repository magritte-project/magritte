import { useContext } from "react"

import { MusicKitContext } from "@/contexts/musicKitContext"

export default function useMusicKit(): MusicKit.Instance {
    const extensionHost = useContext(MusicKitContext)
    if (extensionHost === undefined) {
        throw new Error("useMusicKit used outside of <MusicKitContext.Provider>")
    }
    return extensionHost
}
