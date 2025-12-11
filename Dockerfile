# Usa Node.js 18 (versión estable LTS)
FROM node:18-alpine

# Crea directorio de trabajo
WORKDIR /app

# Copia el package.json primero (optimización de caché de Docker)
COPY package.json ./

# Instala SOLO dependencias de producción
RUN npm install --only=production --no-audit --no-fund

# Copia todo el código fuente
COPY . .

# Expone el puerto que usa Express (3000)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
