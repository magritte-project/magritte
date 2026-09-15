import AuthorizeButton from "@/components/AuthorizeButton"
import ListSection from "@/components/reusable/ListSection"
import useAuthorization from "@/hooks/authorizationHook"

export default function Settings() {
    const { isAuthorized } = useAuthorization()
    return (
        <ListSection title="Account">
            <li className="flex items-center gap-2 px-3 py-2 text-sm">
                <div className="flex-1">
                    {isAuthorized
                        ? "Authorized with Apple Music"
                        : "Not authorized with Apple Music"}
                </div>
                <AuthorizeButton />
            </li>
        </ListSection>
    )
}
