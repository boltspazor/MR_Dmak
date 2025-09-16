# Use Node.js for both build and runtime
FROM node:20-alpine

WORKDIR /app

# Install dependencies for better caching
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve globally for serving static files
RUN npm install -g serve

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "3000"]
