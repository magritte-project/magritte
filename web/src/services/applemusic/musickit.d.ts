/*
 * soundra
 * Copyright (C) 2024  MAINTAINERS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

declare namespace MusicKit {
    declare enum PlaybackBitrate {
        high = "MusicKit.PlaybackBitrate.HIGH",
        standard = "MusicKit.PlaybackBitrate.STANDARD",
    }

    declare enum PlaybackStates {
        none = "MusicKit.PlaybackStates.none",
        loading = "MusicKit.PlaybackStates.loading",
        playing = "MusicKit.PlaybackStates.playing",
        paused = "MusicKit.PlaybackStates.paused",
        stopped = "MusicKit.PlaybackStates.stopped",
        ended = "MusicKit.PlaybackStates.ended",
        seeking = "MusicKit.PlaybackStates.seeking",
        waiting = "MusicKit.PlaybackStates.waiting",
        stalled = "MusicKit.PlaybackStates.stalled",
        completed = "MusicKit.PlaybackStates.completed",
    }

    declare enum PlayerRepeatMode {
        all = "MusicKit.PlayerRepeatMode.all",
        none = "MusicKit.PlayerRepeatMode.none",
        one = "MusicKit.PlayerRepeatMode.one",
    }

    declare enum PlayerShuffleMode {
        off = "MusicKit.PlayerShuffleMode.off",
        songs = "MusicKit.PlayerShuffleMode.songs",
    }

    declare interface Configuration {
        readonly developerToken: string
        readonly app: {
            readonly name: string
            readonly build?: string
            readonly icon?: string
        }
        readonly bitrate?: PlaybackBitrate
        readonly storefrontId?: string
    }

    declare interface API {
        music<Data extends object = object>(
            path: string,
            queryParameters?: Record<string, string>,
            options?: { fetchOptions?: RequestInit },
        ): Promise<{ data: Data }>
    }

    declare type MediaItem = object

    declare interface Queue {
        readonly currentItem: MediaItem | undefined
        readonly isEmpty: boolean
        readonly items: MediaItem[]
        readonly length: number
        readonly nextPlayableItem: MediaItem | undefined
        readonly position: number
        readonly previousPlayableItem: MediaItem | undefined
    }

    declare type QueueOptions =
        | { album: string }
        | { albums: string[] }
        | { musicVideo: string }
        | { musicVideos: string[] }
        | { playlist: string }
        | { playlists: string[] }
        | { song: string }
        | ({ songs: string[] } & {
              repeatMode?: PlayerRepeatMode
              startPlaying?: boolean
              startTime?: number
          })

    declare interface SeekSeconds {
        BACK: number
        FORWARD: number
    }

    declare type SimpleEventName =
        | "audioTrackAdded"
        | "audioTrackChanged"
        | "audioTrackRemoved"
        | "authorizationStatusDidChange"
        | "authorizationStatusWillChange"
        | "bufferedProgressDidChange"
        | "capabilitiesChanged"
        | "configured"
        | "drmUnsupported"
        | "eligibleForSubscribeView"
        | "forcedTextTrackChanged"
        | "loaded"
        | "mediaCanPlay"
        | "mediaElementCreated"
        | "mediaItemStateDidChange"
        | "mediaItemStateWillChange"
        | "mediaPlaybackError"
        | "mediaSkipAvailable"
        | "mediaUpNext"
        | "metadataDidChange"
        | "playbackBitrateDidChange"
        | "playbackRateDidChange"
        | "playbackTargetAvailableDidChange"
        | "playbackTimeDidChange"
        | "playbackVolumeDidChange"
        | "playerTypeDidChange"
        | "primaryPlayerDidChange"
        | "queueIsReady"
        | "queueItemsDidChange"
        | "queuePositionDidChange"
        | "shuffleModeDidChange"
        | "repeatModeDidChange"
        | "storefrontCountryCodeDidChange"
        | "storefrontIdentifierDidChange"
        | "textTrackAdded"
        | "textTrackChanged"
        | "textTrackRemoved"
        | "timedMetadataDidChange"
    declare type SimpleEventCallback = () => void
    declare type NowPlayingEventName =
        | "nowPlayingItemWillChange"
        | "nowPlayingItemDidChange"
    declare type NowPlayingEventCallback = (event: { item: MediaItem }) => void
    declare type StateChangeEventName =
        | "playbackStateWillChange"
        | "playbackStateDidChange"
    declare type StateChangeEventCallback = (event: {
        oldState: PlaybackStates
        state: PlaybackStates
        nowPlayingItem: MediaItem
    }) => void

    declare interface Instance {
        readonly api: API
        readonly bitrate: PlaybackBitrate
        readonly currentPlaybackDuration: number
        readonly currentPlaybackProgress: number
        readonly currentPlaybackTime: number
        readonly currentPlaybackTimeRemaining: number
        readonly isAuthorized: boolean
        readonly isPlaying: boolean
        readonly nowPlayingItem: MediaItem
        readonly nowPlayingItemIndex: number
        playbackRate: number
        readonly playbackState: PlaybackStates
        previewOnly: boolean
        readonly queue: Queue
        readonly queueIsEmpty: boolean
        repeatMode: PlayerRepeatMode
        seekSeconds: SeekSeconds | undefined
        shuffleMode: PlayerShuffleMode
        readonly storefrontCountryCode: string
        readonly storefrontId: string
        videoContainerElement: HTMLVideoElement | undefined
        volume: number

        addEventListener(
            name: SimpleEventName,
            callback: SimpleEventCallback,
        ): void
        addEventListener(
            name: NowPlayingEventName,
            callback: NowPlayingEventCallback,
        ): void
        addEventListener(
            name: StateChangeEventName,
            callback: StateChangeEventCallback,
        ): void
        authorize(): Promise<string | undefined>
        changeToMediaAtIndex(index: number): Promise<void>
        changeToMediaItem(descriptor: MediaItem | string): Promise<void>
        changeUserStorefront(storefrontId: string): Promise<void>
        clearQueue(): Promise<Queue>
        exitFullscreen(): Promise<void>
        mute(): void
        pause(): void
        play(): void
        playAt(
            position: number,
            options: QueueOptions,
        ): Promise<Queue | undefined>
        playLater(options: QueueOptions): Promise<Queue | undefined>
        playNext(
            options: QueueOptions,
            clear?: boolean,
        ): Promise<Queue | undefined>
        removeEventListener(
            name: SimpleEventName,
            callback: SimpleEventCallback,
        ): void
        removeEventListener(
            name: NowPlayingEventName,
            callback: NowPlayingEventCallback,
        ): void
        removeEventListener(
            name: StateChangeEventName,
            callback: StateChangeEventCallback,
        ): void
        requestFullscreen(element: HTMLElement): Promise<void>
        seekBackward(): Promise<void>
        seekForward(): Promise<void>
        seekToTime(time: number): Promise<void>
        setQueue(options: QueueOptions): Promise<Queue | undefined>
        skipToNextItem(): Promise<void>
        skipToPreviousItem(): Promise<void>
        stop(): Promise<void>
        unauthorize(): Promise<void>
        unmute(): Promise<void>
    }

    declare function getInstance(): Instance
    declare function configure(config: Configuration): Promise<Instance>
    declare function formatArtworkURL(
        artwork: object,
        width: number,
        height: number,
    ): string
}
