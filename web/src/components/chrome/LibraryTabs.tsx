import { MicrophoneStageIcon, DiscIcon, MusicNotesIcon } from "@phosphor-icons/react"
import { useParams } from "@tanstack/react-router"
import classNames from "classnames"

import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"

export interface LibraryTabsProps extends React.HTMLAttributes<HTMLDivElement> {
    readonly className?: string
}

export default function LibraryTabs({ className, children, ...rest }: LibraryTabsProps) {
    const { libraryId } = useParams({ strict: false })

    return (
        <div className={classNames("flex items-center gap-0 drop-shadow-xs", className)} {...rest}>
            <ThemedTabItemLink
                to="/libraries/$libraryId/artists"
                params={{ libraryId: libraryId ?? "0" }}
                icon={MicrophoneStageIcon}
                label="Artists"
                disabled={libraryId === undefined}
                alwaysInline={false}
            />
            <ThemedTabItemLink
                to="/libraries/$libraryId/albums"
                params={{ libraryId: libraryId ?? "0" }}
                icon={DiscIcon}
                label="Albums"
                disabled={libraryId === undefined}
                alwaysInline={false}
            />
            <ThemedTabItemLink
                to="/libraries/$libraryId/songs"
                params={{ libraryId: libraryId ?? "0" }}
                icon={MusicNotesIcon}
                label="Songs"
                disabled={libraryId === undefined}
                alwaysInline={false}
            />
            {children}
        </div>
    )
}
