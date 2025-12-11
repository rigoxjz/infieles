FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --only=production --no-audit --no-fund

COPY . .

# Expone el puerto
EXPOSE 3000

# Indica que la app necesita estas variables
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
