FROM node:18-alpine

WORKDIR /app

COPY package.json ./

# Usa npm install en lugar de npm ci
RUN npm install --production --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
