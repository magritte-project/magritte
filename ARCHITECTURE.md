# Architecture

Magritte is an application server designed to run on desktop-class machines, single-board computers,
network-attached storage devices, and in the cloud. It's split into five main components:

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
separate embedded apps that add functionality to the app.

## Data Architecture

Magritte is intended to manage multiple libraries, e.g. one for each member of a household. Each
library contains zero or more songs, artists, and albums. Libraries are shared with users through
per-user permissions to add, edit, and remove songs, and any user linked to a library can read it.
When a user creates a library, they're granted all permissions on it, and it's only accessible to
them until other users are added. Songs may be added to another library on the same instance.

Playback events are recorded per user, and songs and libraries may have associated artwork.

```
┌─────┐
│Users│
└─────┘
  ╲│╱
   │      ╱┌─────────┐╲         ╱┌─────┐╲      ╱┌───────┐
   └───────│Libraries│──┼─────┬○─│Songs│─○────○─│Sources│
          ╲└─────────┘╱       │ ╲└─────┘╱      ╲└───────┘
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

Songs in a Magritte library can have multiple sources associated with them. Magritte is designed to
support several features built on this:

- A high-fidelity canonical copy of a song can be uploaded as a primary source.
- A lower quality compressed copy of the song can be created during import as a secondary source.
- Streaming services can be used as additional sources of a song.

Files backing sources may be de-duplicated. For example, a single file can serve as the source for
an identical single and album track.

Files are treated as read-only – editing a song's metadata _does not_ modify the underlying files.
Use dedicated software such as [Mp3tag](https://www.mp3tag.de/en/) to edit tags before importing
files into Magritte.

If a song is manually edited, changes made to the underlying file will no longer be reflected when
the library is next synced.

### Streaming Service Libraries

Magritte does not sync with your library on streaming services such as Apple Music. That is to say,
adding a song from a streaming service to a Magritte library does not also add it to your library on
that service. Magritte is at its core a database for managing media that may be backed by multiple
sources. A streaming service is just another source, like a local file.

### Scrobbling

As songs are played back from a Magritte library, front ends keep a timestamped record of all play,
pause, stop, fast forward, and rewind events that occur while the song is played. These playback
events are periodically uploaded to the Magritte server. Playback events can then be used to
calculate play and skip counts, to generate rich reports such as which songs, artists, or albums the
user was listening to in a given period of time, to feed signals into recommendation features, and
as a means of integrating with services like Last.fm.

## Styling & Theming

Magritte uses Tailwind CSS v4 for most application styling. Elements and components use the semantic
theme variables defined in `web/src/styles.css` for colors, spacing, etc. These variables roughly
follow the patterns from Material Design: there are 4 visual levels (`primary`, `secondary`,
`tertiary`, and `quaternary`), each defined as a pair of background and fill colors (e.g. `primary`
and `on-primary`).

Users can customize the theme from **Settings → Theme**. A theme can override any of the semantic
colors, opacities, spacings, and corner radii, as well as the display and monospace fonts and the
color scheme. By default, the editor only shows the `primary` level of the 4 visual levels: changing
a `primary`, `primary-active`, or `on-primary` color calculates the matching colors for the other
levels by stepping the lightness in OKLCH space. Enabling **Show All Colors** allows each level's
colors to be edited individually.

Custom themes are stored in the browser's `localStorage` and applied on startup by overriding the
theme's CSS variables. The theme schema and default values are defined in `web/src/themes/`.
