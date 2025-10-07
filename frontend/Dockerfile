FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including serve)
RUN npm install

# Copy application code
COPY . .

# Build the frontend
RUN npm run build

# Expose port (Railway will override with $PORT)
EXPOSE 8080

# Start the static server
CMD ["npm", "start"]
