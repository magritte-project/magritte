import { CaretLeftIcon, DiscIcon, MicrophoneStageIcon, MusicNotesIcon } from "@phosphor-icons/react"
import { useCanGoBack, useNavigate, useParams, useRouter } from "@tanstack/react-router"
import { type ReactNode } from "react"

import LibrariesButton from "@/components/chrome/LibrariesButton"
import PaletteButton from "@/components/chrome/PaletteButton"
import UserButton from "@/components/chrome/UserButton"
import UserNotificationsButton from "@/components/chrome/UserNotificationsButton"
import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import useHotKey from "@/hooks/hotKeyHook"
import useIsInstalledApp from "@/hooks/installedAppHook"

export interface PageHeaderProps {
    readonly children?: ReactNode
}

export default function PageHeader({ children }: PageHeaderProps) {
    const navigate = useNavigate()
    const { libraryId } = useParams({ strict: false })
    const { history } = useRouter()
    const canGoBack = useCanGoBack()

    useHotKey({ key: "1" }, () => {
        if (libraryId !== undefined) {
            navigate({
                to: "/libraries/$libraryId/artists",
                params: { libraryId },
            })
            return true
        } else {
            return false
        }
    })
    useHotKey({ key: "2" }, () => {
        if (libraryId !== undefined) {
            navigate({
                to: "/libraries/$libraryId/albums",
                params: { libraryId },
            })
            return true
        } else {
            return false
        }
    })
    useHotKey({ key: "3" }, () => {
        if (libraryId !== undefined) {
            navigate({
                to: "/libraries/$libraryId/songs",
                params: { libraryId },
            })
            return true
        } else {
            return false
        }
    })

    const isInstalledApp = useIsInstalledApp()
    return (
        <ThemedHeader
            supplementaryStart={
                isInstalledApp ? (
                    <ThemedSubtleButton disabled={!canGoBack} onClick={() => history.back()}>
                        <CaretLeftIcon weight="bold" />
                    </ThemedSubtleButton>
                ) : undefined
            }
            supplementaryEnd={
                <>
                    <PaletteButton />
                    <UserNotificationsButton />
                    <UserButton />
                </>
            }
        >
            <div className="flex items-center gap-0 drop-shadow-xs">
                <LibrariesButton />
            </div>
            <div className="flex items-center gap-0 drop-shadow-xs">
                <ThemedTabItemLink
                    to="/libraries/$libraryId/artists"
                    params={{ libraryId: libraryId ?? "0" }}
                    icon={MicrophoneStageIcon}
                    label="Artists"
                    disabled={libraryId === undefined}
                />
                <ThemedTabItemLink
                    to="/libraries/$libraryId/albums"
                    params={{ libraryId: libraryId ?? "0" }}
                    icon={DiscIcon}
                    label="Albums"
                    disabled={libraryId === undefined}
                />
                <ThemedTabItemLink
                    to="/libraries/$libraryId/songs"
                    params={{ libraryId: libraryId ?? "0" }}
                    icon={MusicNotesIcon}
                    label="Songs"
                    disabled={libraryId === undefined}
                />
            </div>

            {children}
        </ThemedHeader>
    )
}
