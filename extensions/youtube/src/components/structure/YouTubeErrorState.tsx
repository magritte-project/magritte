import SectionState from "@/components/structure/SectionState"
import { YouTubeError } from "@/youtube/client"

/** Why YouTube could not be asked, with the daily quota running out spelled out */
export default function YouTubeErrorState({ error }: { readonly error: unknown }) {
    return error instanceof YouTubeError && error.isQuotaExceeded ? (
        <SectionState
            status="error"
            message="YouTube's limit for today has been reached. It resets at midnight Pacific time."
        />
    ) : (
        <SectionState status="error" error={error} />
    )
}
