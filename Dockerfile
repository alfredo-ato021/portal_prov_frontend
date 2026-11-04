# Stage 1: Build Frontend SPA Monorepo
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build argument selects which app to bundle (backoffice, portal-proveedor, landing)
ARG APP_NAME=backoffice
ARG VITE_API_BASE_URL=https://factumflux-backend-pxeov3gtya-tl.a.run.app
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Compile all packages and target app
RUN pnpm --filter @factumflux/api-client build || true
RUN pnpm --filter @factumflux/ui build || true
RUN pnpm --filter @factumflux/i18n build || true
RUN pnpm --filter ${APP_NAME} build

# Stage 2: Minimal Nginx Runtime
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/factumflux.conf

# Copy built SPA static files from builder
ARG APP_NAME=backoffice
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

