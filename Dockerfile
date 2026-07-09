FROM nginx:alpine

COPY index.html style.css game.js three.min.js /usr/share/nginx/html/

EXPOSE 80
