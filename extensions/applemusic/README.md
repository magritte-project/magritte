# @magritte/extension-applemusic

Extension which adds Apple Music as a content source and playback engine.

Part of the [Magritte project](https://github.com/magritte-project/magritte).

## Configuration

The Apple Music extension reads its configuration from the environment, or from a `.env` file in the
current directory if one is present.

| Key             | Type   | Required | Description                                                  |
| --------------- | ------ | -------- | ------------------------------------------------------------ |
| TEAM_ID         | string | Yes      | ID of the team the Apple Music key was generated under       |
| APP_ID          | string | Yes      | ID of the app the Apple Music key is associated with         |
| KEY_ID          | string | Yes      | ID of the key on the Apple developer portal                  |
| KEY_SECRET      | string | Yes      | Contents of the key used to authenticate with Apple Music    |
| VITE_STOREFRONT | string | No       | Storefront that your Apple Music account is registered under |

The `KEY_SECRET` value may be in either JWK or PKCS8 format.

## Deployment

This extension can be built for deployment by running `pnpm build`. This will produce an express.js
server under `dist/`. It can be invoked with `node dist/server.js`.
