FROM node:20-slim

WORKDIR /app

COPY frontend/ .

RUN npm install
RUN npm run build

FROM nginx:alpine

COPY --from=0 /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]