# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY prisma ./prisma/

# Install dependencies
RUN npm install --production=false
RUN cd client && npm install --production=false

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the React app
RUN cd client && npm run build

# Create public directory and copy build files
RUN mkdir -p public && cp -r client/build/* ./public/

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma client in production image
RUN npx prisma generate

# Expose port
EXPOSE 5001

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]