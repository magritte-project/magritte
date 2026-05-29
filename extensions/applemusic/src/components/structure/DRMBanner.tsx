import { WarningIcon } from "@phosphor-icons/react"

import useIsDrmSupported from "@/hooks/drmSupportedHook"

export default function DRMBanner() {
    const isDrmSupported = useIsDrmSupported()
    return (
        !isDrmSupported && (
            <div
                role="banner"
                aria-live="polite"
                className="flex items-center gap-2 text-sm font-medium mx-2 p-2 bg-yellow-100 rounded-md"
            >
                <WarningIcon size="3rem" aria-label="Warning" /> Your browser does not support DRM,
                you will be limited to previews of Apple Music content.
            </div>
        )
    )
}
