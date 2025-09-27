# Magritte

A home server to manage and listen to a household's music collections.

## Scope

Magritte is intended to be installed on an in-home server with a large storage medium available e.g. a Synology DiskStation or a Raspberry Pi with an external drive attached.

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

## Development

Once you've installed all of the prerequisites, you can run the development API and web servers:

```sh
just dev
```

After a few moments, you should be able to navigate to the Magritte web frontend in your browser:

```
http://localhost:6479/
```

To execute the tests:

```sh
just test-server
just test-web
```

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
                              │                          
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
