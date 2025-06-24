FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production

COPY src ./src
COPY data ./data

ENV NODE_ENV=production

CMD ["bun", "run", "src/bot.ts"]