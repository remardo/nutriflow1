# ---------- Stage 1: Build frontend ----------
FROM node:20-alpine AS build

WORKDIR /app

# Install root dependencies (if monorepo-level)
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source
COPY ./src ./src
COPY ./index.html ./index.html

# Build (assuming Vite/CRA-like script "build" in root package.json)
RUN npm run build

# ---------- Stage 2: Nginx for static SPA ----------
FROM nginx:1.27-alpine

# Default Nginx config for SPA
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]