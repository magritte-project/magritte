import PlayingItemDetails from "@/components/PlayingItemDetails"
import Scrubber from "@/components/Scrubber"
import TransportControls from "@/components/TransportControls"

export default function Extension() {
    return (
        <div className="flex flex-col gap-2 p-4">
            <PlayingItemDetails />
            <Scrubber />
            <TransportControls />
        </div>
    )
}
