FROM php:8.3-apache
COPY public/ /var/www/html/
RUN a2enmod rewrite
EXPOSE 80
