# @magritte/extension-genius

Extension which adds Genius.com supplemental content.

Part of the [Magritte project](https://github.com/magritte-project/magritte).

## Configuration

The Genius.com extension reads its configuration from the environment, or from a `.env` file in the
current directory if one is present.

| Key                 | Type   | Required | Description                                |
| ------------------- | ------ | -------- | ------------------------------------------ |
| GENIUS_ACCESS_TOKEN | string | Yes      | Access token from a genius.com API account |

Access tokens can be created at <https://genius.com/developers>.

## Deployment

This extension can be built for deployment by running `pnpm build`. This will produce an express.js
server under `dist/`. It can be invoked with `node dist/server.js`.
