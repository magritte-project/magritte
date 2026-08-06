# Magritte

## A personal music platform.

- Have your own collection of music files? Install Magritte on your computer or server and start listening to your music from anywhere.
- Use a streaming service? Magritte supports streaming from various providers through an ecosystem of extensions. Combine your own music collection with streaming to create a seamless listening experience.
- Want to share your music with your family? Magritte supports multiple users and multiple libraries. Create a separate curated library for your family to listen to together.
- Don't want to self-host? Use a public streaming only instance instead.

- Looking to understand your listening habits better but don't want to use a proprietary service? Magritte has built in support for scrobbling. Get insights without losing control over your data.
- Like to hack on the code? Magritte is open source and contributions are welcome.

[![Test](https://github.com/decarbonization/magritte/actions/workflows/test.yml/badge.svg)](https://github.com/decarbonization/magritte/actions/workflows/test.yml)

![Screenshot of the songs library view with a song playing](https://github.com/decarbonization/magritte/blob/main/README/screenshot.png?raw=true)

## Scope

Magritte is intended to be highly flexible in how it can be configured and where it can be installed.

- The first targeted configuration is in-home servers with a large storage medium available e.g. a Synology DiskStation or a Raspberry Pi with an m.2 hat.
- In the medium term, Magritte will also be distributable as an app which can be installed on any device with a desktop class operating system.
- Longer term, it will be possible to configure Magritte to run on cloud infrastructure. In this scenario, Magritte will default to not allowing file uploads to discourage it being used as a tool for piracy.
- The ultimate goal is for Magritte to ship on its own dedicated hardware, likely something around the level of oomph of a Raspberry Pi 5.

### Known Working Configurations

- macOS 15.5 - 26.2
- Arch Linux
- Raspberry Pi OS

## Front ends

- [web](/magritte/tree/main/web): The built-in web front end.
- [rené](https://github.com/decarbonization/rene): A front end that runs on embedded Linux devices like the Raspberry Pi.

## AI Usage Disclosure

Claude Code and Gemini were used for research, to generate config files, to find solutions for bugs, to generate some SQL queries, and to generate some of the code in the AI-related extensions. A majority of the code in this repository was handwritten.

## Installation

Magritte uses [`asdf`](https://asdf-vm.com/) to manage tooling and [`just`](https://just.systems/) to handle tasks. Follow the Getting Started directions to install `asdf` on your machine. Once you've installed `asdf`, you can bootstrap your development environment:

```sh
./bootstrap
```

### After Installation

Bootstrapping the development environment creates a single `.env` file at the root project directory and symlinks it into the `server/` and `web/` subdirectories. Edit the entries the `.env` file to be suitable for your local working environment.

#### Secrets

Because Magritte is intended to be installable into a wide range of environments, it offers multiple solutions for managing secrets:

1. Secrets may be loaded from the environment. If the environment contains a full set of secrets, Magritte will use those values when signing and validating sensitive data. **This is the solution to use if you are running Magritte on a server or in the cloud.**
2. Secrets may be automatically generated, stored, and loaded from the user's keyring (Keychain, KWallet, etc). This requires enabling the `desktop` extras when installing Magritte (done automatically by the `bootstap` script). **This is a good solution if you are running Magritte on your computer.**

Magritte can generate secrets and salts for you:

```sh
# Run twice: once for SESSION_TOKEN_SECRET and again for FEATURE_TOKEN_SECRET
uv run magritte new-token-secret
# Run once for SALT
uv run magritte new-password-salt
```

#### Extensions

You may wish to review the `.env` files in the extension projects included in the monorepo. The `bootstrap` script will create `.env` files in any extensions which have them, but further configuration such as API keys may be necessary for an extension to function.

## Development

Once you've installed all of the prerequisites, you can run the development API and web servers:

```sh
just dev
```

After a few moments, you should be able to navigate to the Magritte web front end in your browser:

```
http://localhost:6479/
```

To execute the tests:

```sh
just test
```

To run a development server for a specific extension, use the `extensions::dev` recipe with the extension name as an argument:

```sh
just extensions::dev applemusic
```

Out of the box, Magritte does not know about any extensions. To add an extension, sign in as an administrator and navigate to the Admin area using the user menu in the top right corner. Once there, click the + import extension button and enter the extension's URL. For example, the Apple Music extension running locally would have the URL <http://localhost:9292/>. After an extension has been imported, any user can install it from the My Settings page located in the user menu.

### DB Migrations

To create a new database migration, use the `server::db-create-migration` recipe with the migration name as an argument:

```sh
just server::db-create-migration "extensions_table"
```

This will create a new migration file in `server/migrations/` with the given name.

To apply the migration to the database, use the `server::db-migrate` recipe:

```sh
just server::db-migrate
```

__Important:__ Migrations are currently not distributed with the package. This is [an open issue](https://github.com/decarbonization/magritte/issues/5).

If you need to clear the database and start fresh, you can delete it from the file system and restart the server. Assuming you haven't set a custom `DATA_HOME` environment variable, the database file will be located at `~/.magritte/db.sqlite3`. You may also wish to delete the artwork cache directory at `~/.magritte/artwork/`, however this is not generally required.

## Packaging

The server and web app can be packaged together for execution outside of a development environment:

```sh
just build
```

The package recipe will first build the web app, then bundle the server into a python package which includes both the server and web app code. This package can then be installed and run outside of a development environment.

## Data Architecture

Magritte is intended to manage multiple libraries. Each library is owned by a single user, a member of a household. Each library contains zero or more songs, artists, and albums. Unless set to private, all users on a Magritte server may access the contents of any library, but they may only edit items in their own library. Songs from one library can be linked to another. Linked songs are read only.

```
┌─────┐
│Users│
└─────┘
   ┼
   │       ┌─────────┐╲         ╱┌─────┐╲      ╱┌───────┐
   └──────┼│Libraries│──┼─────┬○─│Songs│─○────○─│Sources│
           └─────────┘╱       │ ╲└─────┘╱      ╲└───────┘
                              │    ╲│╱
                              │     ○
                              │     │          ╱┌──────────────┐
                              │     └─────────○─│PlaybackEvents│
                              │                ╲└──────────────┘
                              │
                              │
                              │        ╱┌───────┐
                              ├───────○─│Artists│
                              │        ╲└───────┘
                              │            ╲│╱
                              │             ┼
                              │             ┼
                              │            ╱│╲
                              │        ╱┌──────┐
                              └───────○─│Albums│
                                       ╲└──────┘
```

## File Management

Songs in a Magritte library can have multiple sources associated with them. This enables several features:

- A high fidelity canonical copy of a song can be uploaded as a primary source
- A lower quality compressed copy of the song can be created during import as a secondary source
- Streaming services can be used as additional sources of a song.

Files backing sources may be de-duplicated. This means that e.g. a single file can serve as the source for an identical single and album track.

By default, files are treated as read only. Editing a song's metadata _does not_ modify the underlying files. Re-encoding a file during upload will never erase the original.

## Streaming Service Libraries

Magritte does not integrate with libraries from streaming services such as Apple Music. That is to say, adding a song from a streaming service to a Magritte library does not also add it to your library on that service. Magritte is at its core a database for managing media which may be backed by multiple sources. A streaming service is just another source, like a local file.

## Scrobbling

As songs are played back from a Magritte library, front ends keep a timestamped record of all play, pause, fast forward, rewind, and skip previous/next events which occur while the song is played. These playback events are periodically uploaded to the Magritte server. Playback events can then be used to calculate play and skip counts, to generate rich reports such as what songs/artists/albums the user was listening to in a given period of time, to feed signals into recommendation features, and as means to integrate with services like last.fm.

## Extensions

A Magritte extension is a web app which is run inside of the Magritte front end. Extensions are hosted inside of `<iframe>` elements and messages are passed over a message port. The connection between the extension and its host is established using the `postMessage` API. The handshake and communication process is handled by the `@magritte/sdk` package.

Extensions can be written using any stack, but the ones developed alongside Magritte use the same stack: React + TypeScript built with Vite. To create a new extension, you can follow the standard procedure for standing up a new Vite project. It is recommended that you choose a unique port for your extension project's Vite dev server.

Once you have created a new extension project, you must add an `extension.magritte.json` file to the project's public assets. At a minimum an extension manifest must include a name, id, version, and url. You will likely also want to list the permissions your extension needs to function properly and may want to include commands and source schemes if your extension provides custom content handling or adds new functionality to Magritte.

```json
{
    "name": "Example",
    "id": "magritte.example",
    "version": "0.0.0",
    "url": "..."
}
```

After adding the `extension.magritte.json` file, you will need to modify your extension's `main.tsx` file to connect to the Magritte host app. This can be done using the `ExtensionHost` class exported by the `@magritte/sdk` package.

```tsx
import { ExtensionHost } from '@magritte/sdk'

const extensionHost = await ExtensionHost.connect({
    extensionId: 'magritte.example'
})
```

You must specify the same `extensionId` as the one listed in your `extension.magritte.json` file. If `ExtensionHost.connect` is called outside of a Magritte host app, or the handshake process otherwise fails, it will throw an error. You may wish to wrap the `ExtensionHost.connect` call in a `try/catch` block to handle errors gracefully.

Once you have connected to the Magritte host app, you can use the extension object to interact with the host and perform extension-specific operations. For example, you can use the command coordinator to query the host for available commands and execute them.

```tsx
// Get the command coordinator
const commandCoordinator = await extensionHost.commandCoordinator()

// Query the host for available runnable commands, optionally specifying a query string to filter results
const runnable = await commandCoordinator.queryRunnable({ query: undefined })

// Execute the first runnable command returned by the query
await commandCoordinator.runCommand({ id: runnable[0].id })
```

Note: You must include "commands:query" and "commands:run" in your `extension.magritte.json` file to use the command coordinator.

## Styling & Theming

Magritte uses tailwindcss v4 for most application styling. Whenever elements and components use the semantic theme variables defined in `web/src/styles.css` for colors, spacing, etc. These variables roughly follow the patterns from material design: there are 4 visual levels defined which follow the pattern of level, on-level for background and fill pairs. Magritte does not currently have a mechanism for loading custom themes, but the variables in the theme may be customized to suit your tastes.
