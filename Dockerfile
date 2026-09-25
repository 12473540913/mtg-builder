# Backend-only image — deployed to Google Cloud Run.
# The Vite frontend is deployed separately to Cloudflare Pages.
FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install all deps first (separate layer — caches independently of source changes)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy server source and TypeScript config
COPY server/ ./server/
COPY tsconfig.json ./

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node_modules/.bin/tsx", "server/index.ts"]
