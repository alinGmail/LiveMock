# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json and yarn related files
COPY package.json .yarnrc.yml yarn.lock ./
COPY .yarn ./.yarn

# Copy workspace package.json files
COPY core/package.json ./core/
COPY frontEnd/package.json ./frontEnd/
COPY backEnd/package.json ./backEnd/

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build application
RUN yarn web-build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create data directory
RUN mkdir -p /app/data

# Copy necessary files
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/backEnd ./backEnd
COPY --from=builder /app/frontEnd/dist ./frontEnd/dist
COPY --from=builder /app/core/dist ./core/dist

# Install production dependencies
RUN yarn workspaces focus --production

# Set data directory permissions
RUN chown -R node:node /app/data

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Start application
CMD ["yarn", "web-start"] 