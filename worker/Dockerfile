# The build agent. Claude Code, headless, with git — nothing else, because the
# floor already holds the state and the walls.
FROM node:24-slim

# git and ca-certificates so it can actually clone a customer's repo; ripgrep
# because Claude Code uses it to search a checkout.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates ripgrep \
  && rm -rf /var/lib/apt/lists/*

# Pinned, deliberately.
#
# This used to be an unpinned `npm install -g`, so every rebuild pulled whatever
# was newest and two images built a week apart were not the same software. On a
# fleet that spends money unattended, a CLI changing under you is not a thing to
# discover from the bill.
#
# 2.1.236 is what the package's own "stable" tag pointed at, which is a
# different and more conservative thing than "latest". To move: check
# `npm view @anthropic-ai/claude-code dist-tags`, bump this, rebuild, and read
# one RUN_ONCE=1 log before letting the fleet loop on it.
ARG CLAUDE_VERSION=2.1.236
RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_VERSION}"

# Fail the BUILD if the CLI is not usable, rather than failing every pass at
# runtime and calling it a mystery. A worker whose binary does not run should
# never reach Railway.
RUN claude --version \
  && claude --help > /tmp/help.txt \
  && grep -q -- "--output-format" /tmp/help.txt \
  && grep -q -- "--print" /tmp/help.txt \
  && rm /tmp/help.txt

WORKDIR /app
COPY run.mjs ./run.mjs

# The checkout lives here. Railway mounts a volume at /work so a job that spans
# passes does not re-clone every time.
RUN useradd -m -u 1001 agent && mkdir -p /work && chown agent:agent /work
USER agent
ENV WORKSPACE_DIR=/work

CMD ["node", "/app/run.mjs"]
