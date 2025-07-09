FROM node:20-slim

WORKDIR /app

COPY . /app

RUN npm install
RUN npm run build

# Install nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Remove default nginx config
RUN rm /etc/nginx/sites-enabled/default

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend to nginx serving directory
RUN cp -r dist/* /var/www/html/

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]