# Peak Coach Telegram Bot - Production Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Set environment
ENV NODE_ENV=production

# Start bot
CMD ["npm", "run", "start"]

