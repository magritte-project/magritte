import AuthorizeButton from "@/components/AuthorizeButton"
import RecentItems from "@/components/RecentItems"
import useAuthorization from "@/hooks/authorizationHook"

export default function Home() {
    const { isAuthorized } = useAuthorization()

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-gray-700">
                <p>Authorize Apple Music to see what you've recently played and added.</p>
                <AuthorizeButton />
            </div>
        )
    }

    return (
        <>
            <RecentItems kind="played" limit={5} />
            <RecentItems kind="added" limit={5} />
        </>
    )
}
