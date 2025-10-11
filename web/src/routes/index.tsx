import { useSignIn } from "@/api/hooks/root"
import type { BodySignInSignInPost } from "@/api/openapi"
import { useForm } from "@tanstack/react-form"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    component: App,
})

function App() {
    const signIn = useSignIn()
    const form = useForm({
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
            <header className="min-h-screen bg-[#282c34] text-white text-[calc(10px+2vmin)]">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                    }}
                    className="flex flex-col items-center justify-center"
                >
                    <form.Field name="username">
                        {(field) => (
                            <input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={field.state.value}
                                onChange={(e) =>
                                    field.handleChange(e.currentTarget.value)
                                }
                                onBlur={field.handleBlur}
                            />
                        )}
                    </form.Field>
                    <form.Field name="password">
                        {(field) => (
                            <input
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={field.state.value}
                                onChange={(e) =>
                                    field.handleChange(e.currentTarget.value)
                                }
                                onBlur={field.handleBlur}
                            />
                        )}
                    </form.Field>
                    <button type="submit">Submit</button>
                </form>
            </header>
        </div>
    )
}
