# --- Build stage ---------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# CI (section 6) generates the real src/data/stocks.json before
# `docker build` runs and it gets picked up by the `COPY . .` above -
# so this only creates the placeholder when that hasn't happened
# (plain local `docker build`, or CI's data-generation step being
# skipped), rather than unconditionally overwriting whatever's there.
RUN [ -f src/data/stocks.json ] || (mkdir -p src/data && echo '{"generatedAt": null, "stocks": []}' > src/data/stocks.json)

RUN npm run build

# --- Serve stage -----------------------------------------------------------
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
