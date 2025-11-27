FROM node:18-slim AS builder

WORKDIR /workspace

COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY eslint.config.mjs ./
COPY .lintstagedrc.json ./

COPY apps/executor ./apps/executor
COPY libs/nestjs ./libs/nestjs
COPY libs/pulsar ./libs/pulsar


RUN npm install


RUN npx nx build executor


FROM node:18-slim AS runner

WORKDIR /app

COPY --from=builder /workspace/package*.json ./
COPY --from=builder /workspace/apps/executor/package.json ./apps/executor/package.json
COPY --from=builder /workspace/libs/pulsar/package.json ./libs/pulsar/package.json
ENV NODE_ENV=production
RUN npm ci --omit=dev


COPY --from=builder /workspace/dist ./dist

CMD ["node", "dist/apps/executor/main.js"]