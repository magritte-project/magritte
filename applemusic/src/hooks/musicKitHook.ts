import { useRouteContext } from "@tanstack/react-router"

export default function useMusicKit(): MusicKit.Instance {
    const musicKit = useRouteContext({
        from: "__root__",
        select: (context) => context.musicKit,
    })
    return musicKit
}
