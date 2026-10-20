# Tienda demo de KYC: build de Vite (dist/) + servidor Node (dist-server/main.js). Basado en web/demo/Dockerfile de
# conekta-elements.
#   docker build -t kyc-merchant-demo .
#   docker run --rm -p 3000:3000 --env-file .env kyc-merchant-demo
# Check del balanceador: GET /ping → 200 "pong".
# Las imágenes base vienen del mirror de ECR Public (public.ecr.aws/docker/library), no de Docker Hub: sin límite de pulls.

# ---------- 1. Build ----------
# El resultado es JS plano, así que corre en la plataforma del runner y buildx no emula nada.
FROM --platform=$BUILDPLATFORM public.ecr.aws/docker/library/node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- 2. Runtime: sin node_modules (el servidor solo usa módulos de Node), usuario no root ----------
FROM public.ecr.aws/docker/library/node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/dist-server ./dist-server
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist-server/main.js"]
