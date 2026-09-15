import { useContext } from "react"

import { NavigationContext, type Navigation } from "@/contexts/navigationContext"

export default function useNavigation(): Navigation {
    const navigation = useContext(NavigationContext)
    if (navigation === undefined) {
        throw new Error("useNavigation used outside of <NavigationContext.Provider>")
    }
    return navigation
}
