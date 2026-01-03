# Magritte

A home server to manage and listen to a household's music collections.

[![Test](https://github.com/decarbonization/magritte/actions/workflows/test.yml/badge.svg)](https://github.com/decarbonization/magritte/actions/workflows/test.yml)

![Screenshot of the songs library view with a song playing](https://raw.githubusercontent.com/decarbonization/magritte/refs/heads/main/README/screenshot.png)

## Scope

Magritte is intended to be installed on an in-home server with a large storage medium available e.g. a Synology DiskStation or a Raspberry Pi with an external drive attached.

### Known Working Configurations

- macOS 15.5

## Front ends

- [web](/magritte/tree/main/web): The built-in web front end.
- [rené](https://github.com/decarbonization/rene): A front end that runs on embedded Linux devices like the Raspberry Pi.

## Installation

Magritte uses [`just`](https://github.com/casey/just) to handle tasks and [`asdf`](https://asdf-vm.com/) to manage tooling. Once you've installed `just` and `asdf`, you can bootstrap your development environment:

```sh
just bootstrap
```

### Manual Installation

After installing `asdf`, you will need to install all required plugins:

```sh
asdf plugin add python
asdf plugin add uv
asdf plugin add nodejs
asdf plugin add pnpm
```

Once you've installed the plugins, you can install the tools:

```sh
asdf install
```

Next, follow the installation directions in the [server](/decarbonization/magritte/tree/main/server/README.md) and [server](/decarbonization/magritte/tree/main/web/README.md) README files.

### After Installation

Bootstrapping the development environment creates a single `.env` file at the root project directory and symlinks it into the `server/` and `web/` subdirectories. Edit the entries the `.env` file to be suitable for your local working environment.

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

## Packaging

The server and web app can be packaged together for execution outside of a development environment:

```sh
just package
```

The package recipe will produce `dist/` directories in both `server/` and `web/` and then combine them into a single `dist/` at the project root. The combined `dist/` is intended to be passed off to a deploy pipeline – it does not include the development `uv` virtual environment, nor the `.env` or `.tool-versions` from the root project.

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
