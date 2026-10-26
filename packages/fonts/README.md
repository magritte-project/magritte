# @magritte/fonts

Fonts shared by the Magritte front end and extensions.

Part of the [Magritte project](https://github.com/magritte-project/magritte).

## Usage

Import the stylesheet from your entry point and let your bundler (e.g. Vite) take care of copying
the font files into the build output:

```ts
// All font families
import "@magritte/fonts"
// Or just the families you need
import "@magritte/fonts/fira-go.css"
import "@magritte/fonts/fira-mono.css"
```

| Import                                         | `font-family`                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@magritte/fonts/bitstream-vera-sans.css`      | `"Bitstream Vera Sans"`                                                                         |
| `@magritte/fonts/bitstream-vera-sans-mono.css` | `"Bitstream Vera Sans Mono"`                                                                    |
| `@magritte/fonts/bitstream-vera-serif.css`     | `"Bitstream Vera Serif"`                                                                        |
| `@magritte/fonts/comfortaa.css`                | `"Comfortaa"`                                                                                   |
| `@magritte/fonts/fira-go.css`                  | `"FiraGO"`, `"FiraGO Book"`, `"FiraGO Two"`, `"FiraGO Four"`, `"FiraGO Eight"`, `"FiraGO Hair"` |
| `@magritte/fonts/fira-mono.css`                | `"Fira Mono"`                                                                                   |
| `@magritte/fonts/ibm-plex-sans.css`            | `"IBM Plex Sans"`                                                                               |
| `@magritte/fonts/inter.css`                    | `"Inter"`, `"InterDisplay"`, `InterVariable`                                                    |

## License

The fonts are distributed under their original licenses:

- Bitstream Vera: [Bitstream-COPYRIGHT.TXT](Bitstream-COPYRIGHT.TXT)
- Comfortaa: [Comfortaa-OFL.txt](Comfortaa-OFL.txt)
- FiraGO and Fira Mono: [Mozilla-OFL.txt](Mozilla-OFL.txt)
- IBM Plex Sans: [IBM-License.txt](IBM-License.txt)
- Inter: [Inter-LICENSE.txt](Inter-LICENSE.txt)
