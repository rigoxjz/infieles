# Dockerfile (frontend estático con PHP 8.2 + Apache)
FROM php:8.3-apache

# Copiar todo tu frontend (index.html, script.js, etc.)
COPY public/ /var/www/html/

# Habilitar mod_rewrite (por si más adelante usas rutas bonitas)
RUN a2enmod rewrite

# Mejorar seguridad Apache
RUN echo "ServerTokens Prod" >> /etc/apache2/apache2.conf && \
    echo "ServerSignature Off" >> /etc/apache2/apache2.conf

# Puerto
EXPOSE 80

# Opcional: saludito para saber que funciona
RUN echo "<h1>Infieles Frontend ON (PHP 8.3 + Apache)</h1>" > /var/www/html/status.php
