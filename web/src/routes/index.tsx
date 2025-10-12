import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    component: AppComponent,
})

function AppComponent() {
    return <div className="text-center">Welcome</div>
}
