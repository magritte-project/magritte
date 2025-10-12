import { useSignIn } from "@/api/hooks/root"
import type { BodySignInSignInPost } from "@/api/openapi"
import AppForm from "@/components/AppForm"
import { useAppForm } from "@/hooks/formHook"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    component: App,
})

function App() {
    const signIn = useSignIn()
    const form = useAppForm({
        defaultValues: {
            grant_type: "password",
            username: "",
            password: "",
            scope: "",
        } satisfies BodySignInSignInPost,
        onSubmit: async ({ value }) => {
            const token = await signIn.mutateAsync(value)
            localStorage.setItem("access_token", token.access_token)
        },
    })

    return (
        <div className="text-center">
            <header className="min-h-screen bg-[#282c34] text-white">
                <AppForm
                    form={form}
                    className="flex flex-col items-center justify-center gap-1"
                >
                    <form.AppField name="username">
                        {(field) => <field.InputField placeholder="Username" />}
                    </form.AppField>
                    <form.AppField name="password">
                        {(field) => <field.InputField placeholder="Password" />}
                    </form.AppField>
                    <form.SubmitButton />
                </AppForm>
            </header>
        </div>
    )
}
