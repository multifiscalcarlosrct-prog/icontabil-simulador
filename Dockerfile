# Imagem de produção do iContábil Simulador.
# Debian slim (glibc) para o binário pré-compilado do better-sqlite3 funcionar sem compilar.
FROM node:22-bookworm-slim

WORKDIR /app

# Instala só dependências de produção (camada cacheável).
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o restante do código (node_modules/.env/data ficam de fora via .dockerignore).
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# initDb() roda no boot e cria o schema no volume montado.
CMD ["node", "src/server.js"]
