# BlockOS - BlockStop Operating System
# Custom containerized environment for BlockStop PRO

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies
RUN npm install

# Copy source code
COPY app ./app
COPY lib ./lib
COPY types ./types
COPY public ./public 2>/dev/null || true

# Build application
RUN npm run build

# Runtime stage - BlockOS
FROM node:18-alpine

WORKDIR /app

# Install BlockOS dependencies
RUN apk add --no-cache \
    bash \
    curl \
    wget \
    git \
    jq \
    vim \
    nano \
    htop \
    netcat-openbsd

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public 2>/dev/null || true

# Copy BlockOS CLI
COPY blockos/bin /usr/local/bin
RUN chmod +x /usr/local/bin/blockos /usr/local/bin/blockos-shell

# Create BlockOS directories
RUN mkdir -p /var/log/blockstop /var/lib/blockstop /etc/blockstop

# Set environment variables
ENV NODE_ENV=production
ENV BLOCKOS_VERSION=1.0.0
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT} || exit 1

# Expose port
EXPOSE 3000

# Default command - BlockOS Shell
CMD ["blockos-shell"]

# Labels
LABEL org.blockstop.name="BlockOS - BlockStop Operating System"
LABEL org.blockstop.version="1.0.0"
LABEL org.blockstop.description="Containerized BlockStop PRO security analysis environment"
