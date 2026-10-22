# Architecture

Magritte is an application server which is intended to be able to run on desktop class machines,
single board computers, network attached storage devices, and in the cloud. It's split into roughly
five main components:

```
     ┌────────┐
     │Database│
     └────────┘
          ┼
  ┌───────┴────────┐
  ┼                ┼
┌───┐          ┌──────┐
│API│┼────────┼│Worker│
└───┘          └──────┘
 ╲│╱
  │
  │
  ┼
┌───┐     ╱┌──────────┐
│App│┼───○─│Extensions│
└───┘     ╲└──────────┘
```

The API and its companion worker(s) are responsible for managing users and their libraries. The
front end app allows users to sign in, browse their libraries, and listen to audio. Extensions are
separate embedded apps which add additional functionality to the app.

## Data Architecture

Magritte is intended to manage multiple libraries. Each library is owned by a single user, e.g. a
member of a household. Each library contains zero or more songs, artists, and albums. By default, a
library is only accessible to the user which created it. Additional users can be added to a library
to share access with different permissions for read, write, and remove. Songs may be added to
another library on the same instance.

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

### File Management

Songs in a Magritte library can have multiple sources associated with them. This enables several
features:

- A high fidelity canonical copy of a song can be uploaded as a primary source
- A lower quality compressed copy of the song can be created during import as a secondary source
- Streaming services can be used as additional sources of a song.

Files backing sources may be de-duplicated. This means that e.g. a single file can serve as the
source for an identical single and album track.

Files are treated as read only – editing a song's metadata _does not_ modify the underlying files.
Use dedicated software for this like mp3tag before importing files into Magritte.

If a song is manually edited, changes made to the underlying file will no longer be reflected the
next time the library is synched.

### Streaming Service Libraries

Magritte does not integrate with libraries from streaming services such as Apple Music. That is to
say, adding a song from a streaming service to a Magritte library does not also add it to your
library on that service. Magritte is at its core a database for managing media which may be backed
by multiple sources. A streaming service is just another source, like a local file.

### Scrobbling

As songs are played back from a Magritte library, front ends keep a timestamped record of all play,
pause, fast forward, rewind, and skip previous/next events which occur while the song is played.
These playback events are periodically uploaded to the Magritte server. Playback events can then be
used to calculate play and skip counts, to generate rich reports such as what songs/artists/albums
the user was listening to in a given period of time, to feed signals into recommendation features,
and as means to integrate with services like last.fm.

## Styling & Theming

Magritte uses tailwindcss v4 for most application styling. Elements and components use the semantic
theme variables defined in `web/src/styles.css` for colors, spacing, etc. These variables roughly
follow the patterns from material design: there are 4 visual levels defined which follow the pattern
of level, on-level for background and fill pairs. Magritte does not currently have a mechanism for
loading custom themes, but the variables in the theme may be customized to suit your tastes.
