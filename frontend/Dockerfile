FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl

COPY . .

ENV NODE_OPTIONS=--max_old_space_size=2048
RUN npm install
RUN npm run build

FROM nginx:alpine

COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]