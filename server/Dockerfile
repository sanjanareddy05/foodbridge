FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p logs
RUN addgroup -S appgroup && adduser -S app -G appgroup
RUN chown -R app:appgroup /app
USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node","dist/index.js"]
