# Use official Node.js LTS image
FROM node:18-alpine

# Install PostgreSQL client tools (pg_dump and psql)
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies (use npm install since package-lock.json may not be in build context)
RUN npm install --omit=dev

# Copy backend application code
COPY backend/ .

# Expose port (Railway will override this with PORT env var)
EXPOSE 3001

# Start the application
CMD ["node", "src/server.js"]
