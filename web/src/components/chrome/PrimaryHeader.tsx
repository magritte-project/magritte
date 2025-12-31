import type { ReactNode } from "react"
import ThemedHeader from "@/components/theme/ThemedHeader"
import { useCanGoBack, useRouter } from "@tanstack/react-router"
import { CaretLeftIcon } from "@phosphor-icons/react"
import UserSessionButton from "@/components/UserSessionButton"

export interface PrimaryHeaderProps {
    readonly children?: ReactNode
}

export default function PrimaryHeader({ children }: PrimaryHeaderProps) {
    const { history } = useRouter()
    const canGoBack = useCanGoBack()
    return (
        <ThemedHeader
            supplementaryStart={
                <button
                    type="button"
                    className="px-3 py-2 font-bold rounded-full bg-gray-50 active:bg-gray-100 disabled:bg-transparent disabled:text-gray-300"
                    disabled={!canGoBack}
                    onClick={() => history.back()}
                >
                    <CaretLeftIcon weight="bold" />
                </button>
            }
            supplementaryEnd={<UserSessionButton />}
        >
            {children}
        </ThemedHeader>
    )
}
