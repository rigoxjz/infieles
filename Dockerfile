# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json primero para cache de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar todo el código
COPY . .

# Crear directorio para uploads (para desarrollo)
RUN mkdir -p uploads && chmod 777 uploads

# Crear directorio public si no existe
RUN mkdir -p public

# Puerto
EXPOSE 3000

# Comando para producción
CMD ["node", "server.js"]
