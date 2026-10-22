# Contributing

Contributions are welcomed! Kindly keep these things in mind:

- Pull requests should be short enough to review in about 15 minutes.
- An easy to digest summary / explanation increases chances of your changes being accepted.
- Please limit pull requests to a single commit when possible.
- A change set should not touch both an extension and the main codebase.
    - Please separate out any new APIs required by your extension changes into their own pull
      request.
    - Ideally any new extension APIs were preceded by an enhancement / issue issue.
- Update the AI usage disclosure in the README if you use a new AI tool or apply AI in a new way on
  this codebase.
- Be mindful of the license for the part of the codebase you are working on.

## Getting Started

Magritte uses [`asdf`](https://asdf-vm.com/) to manage tooling and [`just`](https://just.systems/)
to handle tasks. Follow the Getting Started directions to install `asdf` on your machine. Once
you've installed `asdf`, you can bootstrap your development environment:

```sh
$ ./bootstrap
```

Bootstrapping the development environment creates a single `.env` file at the root project directory
and symlinks it into the `server/` and `web/` subdirectories. Edit the entries the `.env` file to be
suitable for your local working environment.

Note: Magritte currently does not support development on Windows. Pull requests welcome!

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
$ magritte generate-secrets
```

Paste the result into your `.env` file.

### Extensions

If you are doing development on Magritte's first party extensions, you may wish to review the `.env`
files in the extension projects included in the monorepo. The `bootstrap` script will create `.env`
files in any extensions which have them, but further configuration such as API keys may be necessary
for an extension to function.

## Development

Once you've installed all of the prerequisites, you can run the development API and web servers:

```sh
$ just dev
```

After a few moments, you should be able to navigate to the Magritte web front end in your browser:

```
http://localhost:6479/
```

To execute the tests:

```sh
$ just test
```

### First Party Extensions

To run a development server for a specific extension, use the `extensions::dev` recipe with the
extension name as an argument:

```sh
$ just extensions::dev applemusic
```

Activating an extension with the `extensions::dev` recipe will automatically import the extension to
your local Magritte instance and run the extension's development server. To add the extension to
your user account:

1. Navigate to the My Settings page
2. Select Extensions
3. Click the + add extension button
4. Pick the extension from the list

The extension can now be opened by searching for it in the cmd+k command palette.

### DB Migrations

To create a new database migration, use the `server::db-create-migration` recipe with the migration
name as an argument:

```sh
$ just server::db-create-migration "extensions_table"
```

This will create a new migration file in `server/migrations/` with the given name.

The next time you run Magritte, it should automatically apply your migration during start up. To
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

The package recipe will first build the web app, then bundle the server into a python package which
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
