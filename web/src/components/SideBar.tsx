import NowPlaying from "@/components/NowPlaying"
import { WaveformIcon } from "@phosphor-icons/react"
import { useSearch } from "@tanstack/react-router"
import ThemedTabItemLabel from "./theme/ThemedTabItemLabel"

export default function SideBar() {
    const { split_tab: activeTab = "now_playing" } = useSearch({
        strict: false,
    })

    function ActiveTabOutlet() {
        switch (activeTab) {
            case "now_playing":
                return <NowPlaying />
        }
    }

    return (
        <div>
            <header className="text-sm font-semibold flex items-center gap-4 p-2">
                <ol className="flex-1 flex items-center justify-center gap-4">
                    <ThemedTabItemLabel
                        isActive={activeTab === "now_playing"}
                        icon={WaveformIcon}
                        label="Now Playing"
                    />
                </ol>
            </header>
            <main>
                <ActiveTabOutlet />
            </main>
        </div>
    )
}
