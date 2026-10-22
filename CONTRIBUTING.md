# Contributing

Contributions are welcome! Kindly keep these things in mind:

- Pull requests should be short enough to review in about 15 minutes.
- An easy-to-digest summary or explanation increases the chances of your changes being accepted.
- Please limit pull requests to a single commit when possible.
- A change set should not touch both an extension and the main codebase.
    - Please separate out any new APIs required by your extension changes into their own pull
      request.
    - Ideally, any new extension APIs should be preceded by an enhancement request or issue.
- Update the [AI usage disclosure](README.md#ai-usage-disclosure) in the README if you use a new AI
  tool or apply AI in a new way on this codebase.
- Be mindful of the license for the part of the codebase you are working on. The project as a whole
  is licensed under the GPL-3.0, while the `packages/api`, `packages/rpc`, and `packages/sdk`
  packages are licensed under the MIT No Attribution license.

## Getting Started

Magritte uses [`asdf`](https://asdf-vm.com/) to manage tooling and [`just`](https://just.systems/)
to handle tasks. Follow the
[asdf Getting Started guide](https://asdf-vm.com/guide/getting-started.html) to install `asdf` on
your machine. Once you've installed `asdf`, you can bootstrap your development environment:

```sh
$ ./bootstrap
```

Bootstrapping the development environment creates a `.env` file at the project root and symlinks it
into the `web/` subdirectory. Edit the entries in the `.env` file to be suitable for your local
working environment.

Note: Magritte currently does not support development on Windows. Pull requests are welcome!

### Secrets

Because Magritte is intended to be installable into a wide range of environments, it offers multiple
solutions for managing secrets:

1. Secrets may be loaded from the environment. If the environment contains a full set of secrets,
   Magritte will use those values when signing and validating sensitive data. **This is the solution
   to use if you are running Magritte on a server or in the cloud.**
2. Secrets may be automatically generated, stored, and loaded from the user's keyring (Keychain,
   KWallet, etc). This requires enabling the `desktop` extras when installing Magritte (done
   automatically by the `bootstrap` script for development). **This is a good solution if you are
   running Magritte on your own machine.**

If you want Magritte to load secrets from the environment instead of your keyring during
development, it can generate secrets and salts for you:

```sh
$ ./admin generate-secrets
```

Paste the result into your `.env` file.

### Extensions

If you are doing development on Magritte's first-party extensions, you may wish to review the `.env`
files in the extension projects included in the monorepo. The `bootstrap` script will create `.env`
files in any extensions that have them, but further configuration such as API keys may be necessary
for an extension to function.

## Development

Once bootstrapping finishes, you can run the development API and web servers:

```sh
$ just dev
```

This starts the API server on port 6477 and the web front end on port 6479. After a few moments, you
should be able to navigate to the Magritte web front end in your browser:

```
http://localhost:6479/
```

To execute the tests:

```sh
$ just test
```

Before opening a pull request, please also format, lint, and type check your changes:

```sh
$ just format
$ just lint
$ just check-types
```

If you make changes to the `magritte/model/` or `magritte/routes/` directories, regenerate the
exported OpenAPI assets to keep them up to date:

```sh
$ just generate-openapi
```

### First-Party Extensions

To run a development server for a specific extension, use the `extensions::dev` recipe with the
extension name as an argument:

```sh
$ just extensions::dev applemusic
```

Activating an extension with the `extensions::dev` recipe will automatically import the extension to
your local Magritte instance and run the extension's development server. To add the extension to
your user account:

1. Click the **User** menu in the top right corner
2. Select **Settings**
3. Select **Extensions**
4. Click the **+ Add Extension** button
5. Pick the extension from the list

The extension can now be opened by searching for it in the command palette (**⌘K** / **Ctrl+K**).

### DB Migrations

To create a new database migration, use the `server::db-create-migration` recipe with the migration
name as an argument:

```sh
$ just server::db-create-migration "extensions_table"
```

This will create a new migration file in `magritte/migrations/versions/` with the given name.

The next time you run Magritte, it should automatically apply your migration during startup. To
manually apply the migration to the database, use the `server::db-migrate` recipe:

```sh
$ just server::db-migrate
```

If you need to clear your database and start fresh during development, you can use the Magritte
admin CLI:

```sh
$ ./admin reset
```

Confirm that you want to reset your instance's data. This will delete everything at the path
specified by the `$DATA_HOME` environment variable. No external library files will be deleted.

### Packaging

The server and web app can be packaged together for execution outside of a development environment:

```sh
$ just build
```

The `build` recipe will first build the web app, then bundle the server into a Python package which
includes both the server and web app code. This package can then be installed and run outside of a
development environment.

### Publishing

To publish the front end packages, run the following command:

```sh
$ just packages::publish
```

To publish the server package with the web app bundled in, run the following commands:

```sh
$ just web::build
$ just server::publish
```

The web app must be built first, as `server::publish` bundles the contents of `web/dist` into the
server package.
