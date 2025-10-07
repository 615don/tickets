FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port (Railway will override with $PORT)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
