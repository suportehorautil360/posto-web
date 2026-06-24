# syntax=docker/dockerfile:1
# posto-web (Next web) — build de produção + `next start`. Não é PWA.
FROM node:22-slim
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# NEXT_PUBLIC_* é embutido em build-time → vem como build args.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_ENV=demo
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
