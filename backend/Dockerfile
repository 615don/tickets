# Use official Node.js LTS image
FROM node:18-alpine

# Install PostgreSQL client tools (pg_dump and psql)
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (Railway will override this with PORT env var)
EXPOSE 3001

# Start the application
CMD ["node", "src/server.js"]
