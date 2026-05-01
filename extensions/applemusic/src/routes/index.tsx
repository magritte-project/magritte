import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    component: function IndexComponent() {
        return (
            <div className="flex flex-col gap-3 p-3">
                <h2 className="font-bold text-lg">Functions</h2>
                <Link to="/search/songs">Search Songs</Link>
                <h2 className="font-bold text-lg">Tests</h2>
                <Link to="/tests/chrome">Chrome</Link>
                <Link to="/tests/nowPlaying">Now Playing</Link>
            </div>
        )
    },
})
