# syntax=docker/dockerfile:1

# Packages the output of `just build` (the wheel in dist/) into a runnable image.
#
# Build with `just docker-build`, or run `just build` and then `docker build .`

# Alpine ships Python 3.12, but Magritte requires 3.13+, so a standalone Python
# is installed with uv.
FROM ghcr.io/astral-sh/uv:alpine3.23

ENV UV_PYTHON_INSTALL_DIR=/opt/python \
    UV_PYTHON_PREFERENCE=only-managed \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1

RUN uv python install --no-bin 3.13 \
    && uv venv --python 3.13 /opt/magritte

# Bind-mount the wheel so it isn't left behind in an image layer
RUN --mount=type=bind,source=dist,target=/tmp/dist \
    wheel="$(ls /tmp/dist/*.whl)" \
    && uv pip install --python /opt/magritte "${wheel}[mailtrap]"

RUN addgroup -S -g 1000 magritte \
    && adduser -S -D -H -u 1000 -G magritte magritte \
    && mkdir -p /data /music \
    && chown magritte:magritte /data /music

# Server configuration. See magritte/config.py for details on each variable.
ENV PATH="/opt/magritte/bin:$PATH" \
    ENV=prod \
    DATA_HOME=/data \
    MUSIC_HOME=/music \
    HOST=0.0.0.0 \
    PORT=8090 \
    ENABLE_UPLOADS=false \
    UPLOAD_MAX_FILE_SIZE=1073741824 \
    TOKEN_ALGORITHM=HS256

# The following variables are unset by default. They are intentionally not declared
# with ENV above, because an empty value is not equivalent to an unset one for all of
# them. Set them from your compose file, or in $DATA_HOME/env.
#
# Secrets. If these are not all set and $DATA_HOME/env does not exist, random
# secrets are generated into $DATA_HOME/env before `magritte run` starts:
#   SESSION_TOKEN_SECRET
#   FEATURE_TOKEN_SECRET
#   SALT
#
# Optional:
#   WEB_URL                 Public URL of this instance. Defaults to http://localhost:$PORT
#   DB                      Database URL. Defaults to sqlite in $DATA_HOME/db.sqlite3
#   EMAIL_SENDER_ADDRESS    Defaults to noreply@<host of WEB_URL>
#   EMAIL_SMTP              SMTP server URL including credentials
#   EMAIL_MAILTRAP_API_KEY  Mailtrap API key

COPY --chmod=755 <<'EOF' /usr/local/bin/docker-entrypoint.sh
#!/bin/sh
set -e

# Generate secrets on first run, unless they were all provided through the
# environment. Values in $DATA_HOME/env override the environment, so generating
# them anyway would silently replace any secrets set in a compose file.
if [ "$1" = "magritte" ] && [ "$2" = "run" ]; then
    env_file="$DATA_HOME/env"
    if [ ! -e "$env_file" ] \
        && { [ -z "$SESSION_TOKEN_SECRET" ] || [ -z "$FEATURE_TOKEN_SECRET" ] || [ -z "$SALT" ]; }; then
        mkdir -p "$DATA_HOME"
        (umask 077 && magritte generate-secrets > "$env_file.tmp")
        mv "$env_file.tmp" "$env_file"
        echo "Generated secrets in $env_file" >&2
    fi
fi

exec "$@"
EOF

USER magritte
WORKDIR /data
VOLUME ["/data", "/music"]
EXPOSE 8090

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["magritte", "run"]
