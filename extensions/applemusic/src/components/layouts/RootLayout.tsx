import { CaretLeftIcon } from "@phosphor-icons/react"
import { WarningIcon } from "@phosphor-icons/react/dist/ssr"
import { Outlet, useCanGoBack, useRouter } from "@tanstack/react-router"

import AuthorizeButton from "@/components/AuthorizeButton"
import useIsDrmSupported from "@/hooks/drmSupportedHook"

export default function RootLayout() {
    const { history } = useRouter()
    const canGoBack = useCanGoBack()
    const isDrmSupported = useIsDrmSupported()

    return (
        <>
            <header className="shrink-0 sticky top-0 bg-white/95 text-sm font-semibold flex items-center gap-4 p-2 z-40 overflow-x-auto">
                <button disabled={!canGoBack} onClick={() => history.back()} title="Back">
                    <CaretLeftIcon weight="bold" />
                </button>
                <div className="flex-1">Apple Music</div>
                <AuthorizeButton />
            </header>
            {!isDrmSupported && (
                <div
                    role="banner"
                    aria-live="polite"
                    className="flex items-center gap-2 text-sm font-medium mx-2 p-2 bg-yellow-100 rounded-md"
                >
                    <WarningIcon size="3rem" aria-label="Warning" /> Your browser does not support
                    DRM, you will be limited to previews of Apple Music content.
                </div>
            )}
            <Outlet />
        </>
    )
}
