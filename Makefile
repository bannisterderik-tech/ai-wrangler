# Convenience only. Deliberately NOT a package.json: a package.json at the repo
# root makes every build platform think the root is the app, and that broke four
# deploys in a row — Vercel's root directory, Vercel's file tracing, Railway
# choosing Railpack over the Dockerfile, and then `next: not found`.
#
# The app is web/. Point every platform's Root Directory at it.

.PHONY: dev build start test migrate

dev:      ; npm --prefix web run dev
build:    ; npm --prefix web run build
start:    ; npm --prefix web run start
test:     ; npm --prefix web test
migrate:  ; npm --prefix web run db:migrate
