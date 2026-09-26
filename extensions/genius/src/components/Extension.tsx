import Lyrics from "@/components/Lyrics"
import SuspenseBoundary from "@/components/reusable/SuspenseBoundary"

export default function Extension() {
    return (
        <SuspenseBoundary>
            <Lyrics />
        </SuspenseBoundary>
    )
}
