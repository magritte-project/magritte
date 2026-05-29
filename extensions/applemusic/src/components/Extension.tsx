import AuthorizeButton from "@/components/AuthorizeButton"
import Search from "@/components/routes/Search"
import DRMBanner from "@/components/structure/DRMBanner"

export default function Extension() {
    return (
        <>
            <header className="shrink-0 sticky top-0 bg-white/95 text-sm font-semibold flex items-center gap-4 p-2 z-40 overflow-x-auto">
                <div className="flex-1">Apple Music</div>
                <AuthorizeButton />
            </header>
            <DRMBanner />
            <Search />
        </>
    )
}
