There is a lot of information around this project in README.md.

This project uses the following tooling:

- oxlint and oxfmt for linting and formatting the TypeScript codebases
- tsx for type checking the TypeScript codebases
- ruff for linting and formatting the Python codebases
- ty for type checking the Python codebases
- hey-api for generating TypeScript types from the API

All tools can be invoked through `just`. The recipes are split into separate `.just` files for
different areas.

If you have been directed to work specifically on an extension, you should avoid making changes
elsewhere in the same commit when possible to make the changes easier to review.

Any time changes are made to the `magritte/models/` or `magritte/routes/` directories,
`just generate-openapi` should be run to keep the exported OpenAPI assets up to date.
