# Usa Node.js 18 (más estable)
FROM node:18-alpine

# Crea directorio de trabajo
WORKDIR /app

# Copia archivos de dependencias
COPY package.json ./

# Instala dependencias (usa npm install en lugar de npm ci)
RUN npm install --only=production

# Copia todo el código
COPY . .

# Expone el puerto que usa Express
EXPORT 3000

# Comando para iniciar
CMD ["node", "server.js"]
