# Magritte

A personal music platform

[![Test](https://github.com/magritte-project/magritte/actions/workflows/test.yml/badge.svg)](https://github.com/magritte-project/magritte/actions/workflows/test.yml)

[Contributing](https://github.com/magritte-project/magritte/blob/HEAD/CONTRIBUTING.md) |
[Extensions](https://github.com/magritte-project/magritte/blob/HEAD/EXTENSIONS.md) |
[Architecture](https://github.com/magritte-project/magritte/blob/HEAD/ARCHITECTURE.md)

## The User Story

- Have your own collection of music files? Install Magritte on your computer or server and start
  listening to your music from anywhere.
- Use a streaming service? Magritte supports streaming from various providers through an ecosystem
  of extensions. Combine your own music collection with streaming to create a seamless listening
  experience.
- Want to share your music with your family? Magritte supports multiple users and multiple
  libraries. Create a separate curated library for your family to listen to together.
- Don't want to self-host? Use a public streaming only instance instead.

---

- Looking to understand your listening habits better but don't want to use a proprietary service?
  Magritte has built in support for scrobbling. Get insights without losing control over your data.
- Like to hack on the code? Magritte is open source and contributions are welcome.

## The Scope

Magritte is intended to be highly flexible in how it can be configured and where it can be
installed.

- The first targeted configuration is in-home servers with a large storage medium available e.g. a
  Synology DiskStation or a Raspberry Pi with an m.2 hat.
- In the medium term, Magritte will also be distributable as an app which can be installed on any
  device with a desktop class operating system.
- Longer term, it will be possible to configure Magritte to run on cloud infrastructure. In this
  scenario, Magritte will default to not allowing file uploads to discourage it being used as a tool
  for piracy.
- The dream is for Magritte to ship on its own dedicated hardware, likely something around the level
  of oomph of a Raspberry Pi 5.

### Known Working Configurations

- macOS 15.5 - 26.5
- Arch Linux
- Raspberry Pi OS

## AI Usage Disclosure

The Magritte project contains a mix of handwritten code and AI output.

- Claude Code and Gemini have been used for research
- Claude Code has been used to...
    - Generate config files
    - Find and apply solutions for bugs
    - Generate complex SQL queries
    - Apply repetitive pattern refactors
    - Generate and extend unit tests
    - Generate whole extension projects

The architecture and core vision of Magritte came from thinking humans.
