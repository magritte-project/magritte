import { useContext } from "react"

import { YouTubeContext, type YouTube } from "@/contexts/youtubeContext"

export default function useYouTube(): YouTube {
    const youtube = useContext(YouTubeContext)
    if (youtube === undefined) {
        throw new Error("useYouTube used outside of <YouTubeContext.Provider>")
    }
    return youtube
}
