# Extensions

A Magritte extension is a web app that runs inside the Magritte front end. Extensions are hosted in
`<iframe>` elements and messages are passed over a message port. The connection between the
extension and its host is established using the `postMessage` API. The handshake and communication
process is handled by the `@magritte/sdk` package.

Extensions can be written using any stack, but the ones developed alongside Magritte use the same
basic stack: React + TypeScript built with Vite. To create a new extension, you can follow the
standard procedure for standing up a new Vite project. It is recommended that you choose a unique
port for your extension project's Vite dev server.

Once you have created a new extension project, you must add an `extension.magritte.json` file to the
project's public assets. At a minimum, an extension manifest must include a `name`, `id`, `version`,
and `url`. You will likely also want to list the `permissions` your extension needs to function
properly. If your extension adds new functionality to Magritte or provides custom content handling,
you may also want to include `commands` and `sourceSchemes`.

```json
{
    "name": "Example",
    "id": "magritte.example",
    "version": "0.0.0",
    "url": "/"
}
```

Optional manifest fields include `description`, `icon_url`, `preferredWidth`, `preferredHeight`,
`permissions`, `commands`, `sourceSchemes`, and `searchCommand`. See `ExtensionManifest` in
`magritte/schemas/extension.py` for the full schema.

After adding the `extension.magritte.json` file, you will need to modify your extension's `main.tsx`
file to connect to the Magritte host app. This can be done using the `ExtensionHost` class exported
by the `@magritte/sdk` package.

```tsx
import { ExtensionHost } from "@magritte/sdk"

const extensionHost = await ExtensionHost.connect({
    extensionId: "magritte.example",
})
```

You must specify the same `extensionId` as the one listed in your `extension.magritte.json` file. If
`ExtensionHost.connect` is called outside of a Magritte host app, or the handshake process otherwise
fails, it will throw an error. You may wish to wrap the `ExtensionHost.connect` call in a
`try/catch` block to handle errors gracefully.

Once you've modified your extension's `main.tsx`, start the development server and import the
extension into your local Magritte instance:

1. Sign in to an administrator account
2. Click the **User** menu in the top right corner
3. Select **Settings**
4. Select **Manage Extensions** in the **Admin** section
5. Click the **+ Import Extension** button
6. Enter your extension's development server URL – for example, the Apple Music extension would have
   the URL `http://localhost:9292/`

After an extension has been imported, any user can install it from **Settings → Extensions** in the
user menu.

Now that you have everything set up to build out your extension, you can use `extensionHost` to
interact with the host and perform extension-specific operations. For example, you can use the
command coordinator to query the host for available commands and execute them.

```tsx
// Get the command coordinator
const commandCoordinator = await extensionHost.commandCoordinator()

// Query the host for runnable commands; optionally pass `query` to filter results
const runnable = await commandCoordinator.queryRunnable({})

// Execute the first runnable command returned by the query, if any
if (runnable.length > 0) {
    await commandCoordinator.runCommand({ id: runnable[0].id })
}
```

> [!NOTE]
> You must include the `"commands:query"` and `"commands:run"` permissions in your
> `extension.magritte.json` file to use the command coordinator.
