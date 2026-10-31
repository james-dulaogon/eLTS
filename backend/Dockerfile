# --- STAGE 1: Build Image ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for compilation)
RUN npm ci

# Copy source code and TypeScript config
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to raw JavaScript inside /dist folder
RUN npm run build

# Remove development installations to save storage space
RUN npm prune --production


# --- STAGE 2: Production Runtime ---
FROM node:18-alpine AS runner

WORKDIR /app

# Set runtime container environment to production
ENV NODE_ENV=production

# Copy only production configuration files
COPY package*.json ./

# Copy compiled JavaScript files and production modules from previous stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Create a local upload directory for the PDF documents
RUN mkdir -p /app/uploads

# Expose backend service port
EXPOSE 5000

# Fire up the Express web server engine
CMD ["node", "dist/server.js"]
