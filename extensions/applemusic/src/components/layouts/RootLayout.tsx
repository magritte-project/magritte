import { CaretLeftIcon } from "@phosphor-icons/react"
import { Outlet, useCanGoBack, useRouter } from "@tanstack/react-router"

import AuthorizeButton from "@/components/AuthorizeButton"

export default function RootLayout() {
    const { history } = useRouter()
    const canGoBack = useCanGoBack()
    return (
        <>
            <header className="shrink-0 sticky top-0 bg-white/95 text-sm font-semibold flex items-center gap-4 p-2 z-40 overflow-x-auto">
                <button disabled={!canGoBack} onClick={() => history.back()} title="Back">
                    <CaretLeftIcon weight="bold" />
                </button>
                <div className="flex-1">Apple Music</div>
                <AuthorizeButton />
            </header>
            <Outlet />
        </>
    )
}
