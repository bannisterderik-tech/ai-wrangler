# AI Wrangler — the control plane. One image, runs on Railway / Fly / any Node host.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No DATABASE_URL at build time: nothing in the build path may touch the database.
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S wrangler -u 1001

COPY --from=build --chown=wrangler:nodejs /app/.next/standalone ./
COPY --from=build --chown=wrangler:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=wrangler:nodejs /app/public ./public
# Migrations run at boot, so the SQL and the runner scripts ship with the image.
COPY --from=build --chown=wrangler:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=wrangler:nodejs /app/scripts ./scripts

USER wrangler
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "scripts/start.mjs"]
