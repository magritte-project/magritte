import useNowPlaying from "@/hooks/nowPlayingHook"

export default function PlayingItemDetails() {
    const { item } = useNowPlaying()
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="font-medium">{item ? (item.title ?? "--") : "Nothing Playing"}</div>
            <div className="text-sm">
                {item?.album_title ?? "--"} <span className="text-gray-500">by</span>{" "}
                {item?.artist_name ?? "--"}
            </div>
        </div>
    )
}
