# Yunahliam Enterprise store: storefront + API in one container.
# The SQLite database lives in /data; mount a persistent volume there or every deploy starts empty.
FROM node:24-alpine

WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev

COPY . .
RUN mkdir -p /data && chown node:node /data

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/store.db \
    TRUST_PROXY=true
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "server/src/server.js"]
