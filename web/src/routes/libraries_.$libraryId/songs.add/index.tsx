import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/libraries_/$libraryId/songs/add/")({
    component: function NoSelectionComponent() {
        return (
            <div className="text-2xl text-gray-400 text-center p-16">
                No Selection
            </div>
        )
    },
})
