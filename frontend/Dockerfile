# --- STAGE 1: Build Image ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy configuration matrices and source blueprints
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.ts ./
COPY index.html ./
COPY tsconfig*.json ./
COPY src/ ./src/

# Compile production-ready compressed build assets into /dist folder
RUN npm run build


# --- STAGE 2: Production Nginx Server ---
FROM nginx:1.25-alpine AS runner

# Remove the default Nginx placeholder website configuration
RUN rm /etc/nginx/conf.d/default.conf

# Create a custom Nginx routing profile to support React Router SPA fallbacks
RUN echo "server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}" > /etc/nginx/conf.d/elts.conf

# Copy production files from builder stage straight into the public server directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose web service entry port
EXPOSE 3000

# Start up Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
