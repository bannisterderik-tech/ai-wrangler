# The build agent. Claude Code, headless, with git — nothing else, because the
# floor already holds the state and the walls.
FROM node:24-slim

# git and ca-certificates so it can actually clone a customer's repo; ripgrep
# because Claude Code uses it to search a checkout.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates ripgrep \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app
COPY run.mjs ./run.mjs

# The checkout lives here. Railway mounts a volume at /work so a job that spans
# passes does not re-clone every time.
RUN useradd -m -u 1001 agent && mkdir -p /work && chown agent:agent /work
USER agent
ENV WORKSPACE_DIR=/work

CMD ["node", "/app/run.mjs"]
