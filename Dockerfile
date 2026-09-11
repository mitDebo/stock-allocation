# --- Build stage ---------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# TODO(section 6): replace this stub with the real data-generation CLI
# entry point (a CLI wrapper around scripts/generate-stock-data.js, added
# in section 6 once Finnhub secrets are wired into CI). Until then this
# just gives Vite something to bundle so the app shell builds and serves;
# section 4's own verification only requires the placeholder page, not
# real stock data.
RUN mkdir -p src/data && echo '[]' > src/data/stocks.json

RUN npm run build

# --- Serve stage -----------------------------------------------------------
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
