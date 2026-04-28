import { useCallback, useState } from "react"

import useAuthorization from "@/hooks/authorizationHook"

export default function AuthorizeButton() {
    const [isBusy, setIsBusy] = useState(false)
    const { isAuthorized, authorize, deauthorize } = useAuthorization()
    const handleClick = useCallback(async () => {
        try {
            setIsBusy(true)
            if (isAuthorized) {
                await deauthorize()
            } else {
                await authorize()
            }
        } finally {
            setIsBusy(false)
        }
    }, [isAuthorized, authorize, deauthorize])
    return (
        <button type="button" onClick={handleClick} disabled={isBusy}>
            {isAuthorized ? "Deauthorize" : "Authorize"}
        </button>
    )
}
