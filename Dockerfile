# Build stage
FROM node:20-alpine as builder

WORKDIR /app

RUN apk add --no-cache git

# Copy source code
COPY . .

RUN corepack enable


# Install dependencies
RUN yarn install

# Build application
RUN yarn web-build

# Production stage
FROM node:20-alpine

WORKDIR /app


RUN apk add --no-cache git

# Create data directory
RUN mkdir -p /app/data

# Copy necessary files
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/backEnd ./backEnd
COPY --from=builder /app/frontEnd/dist ./frontEnd/dist
COPY --from=builder /app/core ./core

RUN corepack enable
# Install production dependencies
RUN yarn workspace back-end install

# Set data directory permissions
RUN chown -R node:node /app/data

# Switch to non-root user
USER node

# Expose port
EXPOSE 9002

# Start application
CMD ["yarn", "web-start"]
