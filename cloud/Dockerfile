# Use Node 18 slim/alpine
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Optional: install build deps if you need native modules
RUN apk add --no-cache python3 make g++ || true

# Copy package.json and lockfile first for caching
COPY package.json package-lock.json* ./

# Install only production deps by default
RUN npm ci --omit=dev

# Copy source
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "src/server.js"]
