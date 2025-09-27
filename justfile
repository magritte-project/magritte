bootstrap:
    asdf plugin add python
    asdf plugin add uv
    asdf plugin add nodejs
    asdf plugin add pnpm
    asdf install
    cd ./server/ && uv sync
    cd ./web/ && pnpm install
