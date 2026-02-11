# Estágio 1: build (precisa do TypeScript em devDependencies)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Estágio 2: imagem final só com deps de produção e o build
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/build ./build

EXPOSE 3001
CMD ["node", "build/index.js"]
