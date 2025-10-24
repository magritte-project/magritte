import type { SongRead } from "@/api/openapi"
import ArtworkImage from "@/components/ArtworkImage"
import ThemedButton from "@/components/theme/ThemedButton"
import usePlayer from "@/hooks/playerHook"
import usePlayerState from "@/hooks/playerStateHook"
import { ArrayQueueShard } from "@/playback/queue"
import {
    PauseIcon,
    PlayIcon,
    SkipBackIcon,
    SkipForwardIcon,
} from "@phosphor-icons/react"
import classNames from "classnames"

export default function NowPlaying() {
    const player = usePlayer()
    const { playbackState, playingSong, queue } = usePlayerState()
    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-3 p-4">
                <ArtworkImage
                    className="w-full aspect-square"
                    artworks={playingSong?.artworks}
                    itemTitle={playingSong?.title}
                />
                <div className="flex flex-col items-center gap-1 text-sm text-center">
                    <div className="font-bold">
                        {playingSong?.title ?? "--"}
                    </div>
                    <div className="text-gray-700">
                        {playingSong?.album_title ?? "--"} by{" "}
                        {playingSong?.artist_name ?? "--"}
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <ThemedButton
                        disabled={player.queue.length === 0}
                        onClick={() => player.skipPrevious()}
                    >
                        <SkipBackIcon weight="fill" />
                    </ThemedButton>
                    <ThemedButton
                        disabled={player.queue.length === 0}
                        onClick={() =>
                            player.playbackState === "playing"
                                ? player.pause()
                                : player.resume()
                        }
                    >
                        {playbackState === "playing" ? (
                            <PauseIcon weight="fill" />
                        ) : (
                            <PlayIcon weight="fill" />
                        )}
                    </ThemedButton>
                    <ThemedButton
                        disabled={player.queue.length === 0}
                        onClick={() => player.skipNext()}
                    >
                        <SkipForwardIcon weight="fill" />
                    </ThemedButton>
                </div>
            </div>
            <header className="font-bold text-xl border-t border-gray-200 p-3">
                Up Next
            </header>
            {queue.shards.map((shard, shardIndex) => (
                <section
                    key={`shards[${shard.id}@${shardIndex}]`}
                    className="text-start self-start mb-3"
                >
                    {shard instanceof ArrayQueueShard ? (
                        <ol className="flex flex-col gap-1 px-1">
                            {(shard.items as SongRead[]).map(
                                (song, songIndex) => (
                                    <li
                                        key={`shards[${shard.id}@${shardIndex}].songs[${song.id}@${songIndex}]`}
                                        className={classNames(
                                            "flex flex-col gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-blue-50 rounded-sm",
                                            {
                                                "text-blue-700":
                                                    song.id === playingSong?.id,
                                            },
                                        )}
                                        onClick={() =>
                                            player.replaceQueue({
                                                newQueue: queue,
                                                startingItem: song,
                                                playNow: true,
                                            })
                                        }
                                        onKeyDown={() => {}}
                                    >
                                        <div className="font-bold">
                                            {song?.title ?? "--"}
                                        </div>
                                        <div className="text-gray-700">
                                            {song?.album_title ?? "--"} by{" "}
                                            {song?.artist_name ?? "--"}
                                        </div>
                                    </li>
                                ),
                            )}
                        </ol>
                    ) : (
                        <div className="font-semibold text-xs p-3">
                            {shard.length} Songs
                        </div>
                    )}
                </section>
            ))}
        </div>
    )
}
