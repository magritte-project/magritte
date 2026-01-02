import { MagnifyingGlassIcon, WaveformIcon } from "@phosphor-icons/react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useCallback } from "react"

import NowPlaying from "@/components/NowPlaying"
import Search from "@/components/Search"
import ThemedTabItemLabel from "@/components/theme/ThemedTabItemLabel"

import SecondaryHeader from "./chrome/SecondaryHeader"

export default function SideBarLayout() {
    const navigate = useNavigate()
    const { split_tab: activeTab = "now_playing" } = useSearch({
        strict: false,
    })
    const setActiveTab = useCallback(
        (newTab: typeof activeTab) => {
            navigate({
                to: ".",
                search: (oldSearch) => ({ ...oldSearch, split_tab: newTab }),
                replace: true,
            })
        },
        [navigate],
    )

    function ActiveTabOutlet() {
        switch (activeTab) {
            case "now_playing":
                return <NowPlaying />
            case "search":
                return <Search />
        }
    }

    return (
        <div>
            <SecondaryHeader>
                <button type="button" onClick={() => setActiveTab("now_playing")}>
                    <ThemedTabItemLabel
                        isActive={activeTab === "now_playing"}
                        icon={WaveformIcon}
                        label="Now Playing"
                    />
                </button>
                <button type="button" onClick={() => setActiveTab("search")}>
                    <ThemedTabItemLabel
                        isActive={activeTab === "search"}
                        icon={MagnifyingGlassIcon}
                        label="Search"
                    />
                </button>
            </SecondaryHeader>
            <main>
                <ActiveTabOutlet />
            </main>
        </div>
    )
}
