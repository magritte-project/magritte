import { useCallback } from "react"

import AuthorizeButton from "@/components/AuthorizeButton"
import { secondaryButtonClassName } from "@/components/reusable/buttonStyles"
import ListSection from "@/components/reusable/ListSection"
import useAuthorization from "@/hooks/authorizationHook"
import useExtensionHost from "@/hooks/extensionHostHook"

export default function Settings() {
    const { isAuthorized } = useAuthorization()
    const extensionHost = useExtensionHost()
    // Closing only dismisses this extension, any others stay in the panel
    const handleClose = useCallback(async () => {
        const panel = await extensionHost.panel()
        await panel.close()
    }, [extensionHost])
    return (
        <>
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
            <ListSection title="Extension">
                <li className="flex items-center gap-2 px-3 py-2 text-sm">
                    <div className="flex-1">Hide Apple Music until you open it again</div>
                    <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={handleClose}
                    >
                        Close
                    </button>
                </li>
            </ListSection>
        </>
    )
}
