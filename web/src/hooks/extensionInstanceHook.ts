import { useEffect, useMemo } from "react"

import useExtensionManager from "@/hooks/extensionsManagerHook"

export default function useExtensionInstance(id: string) {
    const extensionManager = useExtensionManager()
    const { instance, isOwner } = useMemo(
        () => extensionManager.acquireInstance(id),
        [extensionManager, id],
    )
    useEffect(() => {
        if (!isOwner) {
            return
        }
        return () => {
            extensionManager.releaseOwnedInstance(instance)
        }
    }, [extensionManager, instance, isOwner])
    return instance
}
